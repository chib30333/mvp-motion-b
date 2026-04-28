// src/modules/payments/payments.schema.ts

import { z } from 'zod';

export const createSubscriptionCheckoutSchema = z.object({
    planCode: z.string().min(1),
    provider: z.enum(['STRIPE', 'YOOKASSA']),
});

export const createBookingCheckoutSchema = z.object({
    provider: z.enum(['STRIPE', 'YOOKASSA']),
});