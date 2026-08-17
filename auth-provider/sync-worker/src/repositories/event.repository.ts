import { prisma } from "../../../db";
import { dispatchLogoutEvents } from "../services/client.services";
import { calculatedNextRetryDelay } from "../utils/backoff";
import { handleDLQ } from "../services/dlq.services";

export async function processPendingEvent(): Promise<number> {
    return await prisma.$transaction(async (tx) => {
        const pendingEvent = await tx.$queryRaw<Array<{
            id: string;
            application_id: string | null;
            payload: string;
        }>>`
            SELECT id, application_id, payload 
            FROM events
            WHERE status = 'PENDING'
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED;
        `;

        if (pendingEvent.length === 0) {
            return 0;
        }

        for (const event of pendingEvent) {
            const targetAppIds = event.application_id? [event.application_id] : 
                (await tx.applications.findMany({
                    where: {
                        logout_notification_url: {
                            not: null
                        }
                    },
                    select: {
                        id: true
                    }
                })).map(app => app.id);
            
            await tx.event_deliveries.createMany({
                data: targetAppIds.map(appId => ({
                    event_id: event.id,
                    application_id: appId,
                    status: 'PENDING',
                    attempt_count: 0
                }))
            });

            await tx.events.update({
                where: { id: event.id },
                data: { status: 'PUBLISHED', published_at: new Date() }
            });
        }

        return pendingEvent.length;

    });
}

export async function processNextEvents(): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
        const jobs = await tx.$queryRaw<Array<{
            id: string;
            event_id: string;
            application_id: string;
            attempt_count: number;
            payload: any;
        }>>`
            SELECT ed.id, ed.event_id, ed.application_id, ed.attempt_count, e.payload
            FROM event_deliveries ed
            JOIN events e ON ed.event_id = e.id
            WHERE ed.status = 'PENDING' OR (ed.status = 'RETRYING' AND ed.next_retry_at <= NOW())
            ORDER BY e.created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;
        `;

        if (jobs.length === 0) return false;

        const job = jobs[0];
        const currentAttempt = job.attempt_count + 1;

        try {
            await dispatchLogoutEvents(job.application_id, job.payload);

            await tx.event_deliveries.update({
                where: { id: job.id },
                data: { status: 'SUCCEEDED', processed_at: new Date(), last_error: null }
            });
        } catch (error: any) {
            const error_message = error instanceof Error ? error.message : 'Unknown error';

            if (currentAttempt >= 3) {
                await tx.event_deliveries.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', 
                    last_error: 'MAX ATTEMPTS REACHED'}
                });

                await handleDLQ(job.id, job.application_id, job.payload, error_message);
            } else{
                const nextRetry = calculatedNextRetryDelay(currentAttempt);
                await tx.event_deliveries.update({
                    where: { id: job.id },
                    data: { 
                        status: 'RETRYING',
                        attempt_count: currentAttempt,
                        next_retry_at: nextRetry,
                        last_error: error_message
                    }
                });
            }
        }

        return true;
    });
}