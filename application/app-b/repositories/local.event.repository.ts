import { prisma } from "@/lib/db";

export const getAllLocalEvent = async function () {
    try {
        return await prisma.processed_events.findMany({
            orderBy: {
                processed_at: 'desc'
            }
        });
    } catch (error) {
        return null;
    }
}

export const createLocalEvent = async function (payload: any) {
    try{
        return await prisma.processed_events.create({
            data: {
                event_id: payload.event_id,
                event_type: payload.event_type,
                result: "All local session revoked"
            }
        })
    } catch (error) {
        return null;
    }
}