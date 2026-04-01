// src/modules/payments/payments.routes.ts

import express from 'express';
import { paymentsController } from './payments.controller.ts';
import { stripeWebhookController } from './stripe/stripeWebhook.controller.ts';
import { yookassaWebhookController } from './yookassa/yookassaWebhook.controller.ts';

// adjust these imports to your project
import { requireAuth } from '../../core/middleware/auth.middleware.ts';
import { validateBody } from '../../core/middleware/validate.middleware.ts';
import {
    createBookingCheckoutSchema,
    createSubscriptionCheckoutSchema,
} from './payments.schema.ts';

export const paymentsRouter = express.Router();
export const paymentsWebhookRouter = express.Router();

paymentsRouter.post(
    '/bookings/:bookingId/checkout',
    requireAuth,
    validateBody(createBookingCheckoutSchema),
    paymentsController.createBookingCheckout
);

paymentsRouter.post(
    '/subscriptions/checkout',
    requireAuth,
    validateBody(createSubscriptionCheckoutSchema),
    paymentsController.createSubscriptionCheckout
);

// Stripe webhook needs raw body
paymentsWebhookRouter.post(
    '/stripe',
    express.raw({ type: 'application/json' }),
    stripeWebhookController.handle
);

// YooKassa usually works with json body
paymentsWebhookRouter.post(
    '/yookassa',
    express.json(),
    yookassaWebhookController.handle
);