import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();
const PORT = 8080;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});