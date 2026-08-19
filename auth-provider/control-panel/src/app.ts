import express, { type Express, type Request, type Response, type NextFunction } from 'express';
// 1. Import router modul dari folder routes/
import groupRouter from './routes/groups.route';
import userRouter from './routes/users.route';
import healthRouter from './routes/health.routes';

const app: Express = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Auth Provider Platform API is running' });
});

app.use('/api/', groupRouter);
app.use('/api/', userRouter);
app.use('/', healthRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});