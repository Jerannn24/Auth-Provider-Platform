import express, { type Express, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import mfaRouter from './routes/mfa.routes';    
import metricRouter from './routes/metrics.routes';
import healthRouter from './routes/health.routes';
import { startWorkerHealthServer } from "./health";

import { metricsMiddleware } from './services/metrics.service';

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});