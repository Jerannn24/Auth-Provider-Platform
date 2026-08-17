import { processPendingEvent } from './repositories/event.repository';
import { processNextEvents } from './repositories/event.repository';

let isRunning = true;
const POLL_INTERVAL_MS = 1000;

async function runWorker() {
  console.log('🚀 [Sync Worker] Service started. Processing events...');

  while (isRunning) {
    try {
      await processPendingEvent();

      const processed = await processNextEvents();

      if (!processed) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (err) {
      console.error('[Sync Worker Error]', err);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

const shutdown = () => {
  console.log('⚠️ [Sync Worker] Shutting down gracefully...');
  isRunning = false;
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

runWorker();