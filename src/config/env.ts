import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),

    DATABASE_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),

    FRONTEND_URL: z.string().url(),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    YOOKASSA_SHOP_ID: z.string().min(1),
    YOOKASSA_SECRET_KEY: z.string().min(1),
});

const parsedEnv = envSchema.parse(process.env);

export const env = parsedEnv;