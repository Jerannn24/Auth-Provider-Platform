import * as eventRepository from "../repositories/event.repository";
import * as applicationRepository from "../repositories/application.repository";

export async function dispatchLogoutEvents(application_id: string, payload: any): Promise<void> {
    const logout_uri = await applicationRepository.getApplicationLogoutNotificationById(application_id);
    if (!logout_uri || !logout_uri.logout_notification_url) {
        throw new Error(`Application with ID ${application_id} does not have a logout notification URL.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 5000);

    try {
        const response = await fetch(logout_uri.logout_notification_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-event-id": payload.event_id,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            throw new Error(`Failed to dispatch logout event. Status: ${response.status}. Error: ${errorText}`);
        }
    } finally {
        clearTimeout(timeout);
    };
}
