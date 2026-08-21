import { processPendingEvent } from './repositories/event.repository';
import { processNextEvents } from './repositories/event.repository';
import { prisma } from '../../db';

let isRunning = true;
let isShuttingDown = false;
let workerPromise: Promise<void> | null = null;
const POLL_INTERVAL_MS = 1000;

async function runWorker() {
  console.log('[Sync Worker] Service started. Processing events...');

  while (isRunning) {
    try {
      await processPendingEvent();
      const processed = await processNextEvents();

      if (!processed && isRunning) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (err) {
      console.error('[Sync Worker Error]', err);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  console.log('[Sync Worker] Service is shutting down...');
}

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isRunning = false;
  isShuttingDown = true;

  console.log(`[Sync Worker] Received ${signal}. Initiating graceful shutdown...`);

  const forceExitTimer = setTimeout(() => {
    console.error('[Sync Worker] Forcefully exiting due to timeout.');
    process.exit(1);
  }, 10000); 

  isRunning = false;

  try {
    if (workerPromise) {
      console.log('[Sync Worker] finish processing current job. Exiting...');
      await workerPromise
    }

      await prisma.$disconnect();
      console.log('[Sync Worker] Database connection closed. Exiting...');

      clearTimeout(forceExitTimer);
      process.exit(0);
  }
  catch (err) {
    console.error('[Sync Worker] Error during shutdown:', err);
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

workerPromise = runWorker();