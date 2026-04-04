import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),

    DATABASE_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),

    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.string().url(),

    FRONTEND_URL: z.string().url(),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    YOOKASSA_SHOP_ID: z.string().min(1),
    YOOKASSA_SECRET_KEY: z.string().min(1),

    COOKIE_REFRESH_TOKEN_NAME: z.string().default('refresh_token'),
});

const parsedEnv = envSchema.parse(process.env);

export const env = parsedEnv;