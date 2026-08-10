import express, { type Express, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';

const app: Express = express();
const PORT = 5000;

app.use(express.json());
app.use(cookieParser());

app.use('/', authRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});