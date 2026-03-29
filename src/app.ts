import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.ts';
import routes from './routes/index.ts';
import { errorMiddleware } from './core/middleware/error.middleware.ts';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api', routes);

app.use(errorMiddleware);

export default app;