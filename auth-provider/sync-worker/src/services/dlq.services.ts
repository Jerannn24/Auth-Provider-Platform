export async function handleDLQ(jobId: string, applicationId: string, payload: any, errorMessage: string): Promise<void> {
    console.error(`[DEAD-LETTER-QUEUE ALERT] Delivery ID ${jobId} Gagal Permanen!`, {
    applicationId,
    eventId: payload?.event_id,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  });
}