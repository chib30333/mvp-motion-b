// src/modules/payments/payments.schema.ts

import { z } from 'zod';

export const createSubscriptionCheckoutSchema = z.object({
    body: z.object({
        planCode: z.string().min(1),
        provider: z.enum(['STRIPE', 'YOOKASSA']),
    }),
});

export const createBookingCheckoutSchema = z.object({
    params: z.object({
        bookingId: z.string().min(1),
    }),
    body: z.object({
        provider: z.enum(['STRIPE', 'YOOKASSA']),
    }),
});