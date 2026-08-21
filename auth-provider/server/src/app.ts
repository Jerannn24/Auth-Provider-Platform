import express, { type Express, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import mfaRouter from './routes/mfa.routes';    
import metricRouter from './routes/metrics.routes';
import healthRouter from './routes/health.routes';
import { startWorkerHealthServer } from "./health";
import { metricsMiddleware } from './services/metrics.service';
import { prisma } from '../../db';
import { Server } from 'node:http';

startWorkerHealthServer();

const app: Express = express();
const PORT = 8080;

app.use(
    cors({
        origin: [
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:5173",
        ],
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(metricsMiddleware);

app.use('/', authRoutes);
app.use('/', mfaRouter);
app.use('/', metricRouter);
app.use('/', healthRouter);

const server = app.listen(PORT, '0.0.0.0', () => {
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
            server.close((err) => {
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