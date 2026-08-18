import express, { type Express, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import mfaRouter from './routes/mfa.routes';    
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

app.use('/', authRoutes);
app.use('/', mfaRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});