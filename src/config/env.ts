import 'dotenv/config';
import { z } from 'zod';

const optionalString = z.preprocess((value) => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
}, z.string().optional());

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),

    DATABASE_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),

    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_CALLBACK_URL: optionalString.pipe(z.url().optional()),

    FRONTEND_URL: z.string().url().default('http://localhost:5173'),

    STRIPE_SECRET_KEY: optionalString,
    STRIPE_WEBHOOK_SECRET: optionalString,

    YOOKASSA_SHOP_ID: optionalString,
    YOOKASSA_SECRET_KEY: optionalString,

    COOKIE_REFRESH_TOKEN_NAME: z.string().default('refresh_token'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const missing = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n  ');
    console.error(`Invalid environment variables:\n  ${missing}`);
    process.exit(1);
}

export const env = parsed.data;
