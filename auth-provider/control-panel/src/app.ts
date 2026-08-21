import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import groupRouter from './routes/groups.route';
import userRouter from './routes/users.route';
import healthRouter from './routes/health.routes';
import appRouter from './routes/application.route';

import cors from 'cors';
import { prisma } from '../../db';

const app: Express = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Auth Provider Platform API is running' });
});

app.use('/api/', groupRouter);
app.use('/api/', userRouter);
app.use('/api/', appRouter);
app.use('/', healthRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const controlPanel = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`[Server] Received ${signal}. Initiating graceful shutdown...`);

    const forceExitTimer = setTimeout(() => {
        console.error('[Server] Forcefully exiting due to timeout.');
        process.exit(1);
    }, 10000);

    try{
        await new Promise<void>((resolve, reject) => {
            controlPanel.close((err) => {
                if (err) return reject(err);
                resolve();
                });
        });

        await prisma.$disconnect();
        console.log('[Server] Database connection closed. Exiting...');

        clearTimeout(forceExitTimer);
        process.exit(0);
    } catch (error) {
        console.error('[Server] Error occurred during graceful shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));