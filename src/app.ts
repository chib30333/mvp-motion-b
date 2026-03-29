import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.ts';
import router from './routes/index.ts';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use('/api', router);

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

export default app;