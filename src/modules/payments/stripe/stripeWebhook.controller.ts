// src/modules/payments/stripe/stripeWebhook.controller.ts
import type { Request, Response } from 'express';
import { stripeService } from './stripe.service.ts';
import { paymentsService } from '../payments.service.ts';
import { env } from '../../../config/env.ts';

export const stripeWebhookController = {
    async handle(req: Request, res: Response) {
        const signature = req.headers['stripe-signature'];

        if (!signature || Array.isArray(signature)) {
            return res.status(400).send('Missing Stripe signature');
        }

        const event = stripeService.constructWebhookEvent(
            req.body,
            signature,
            env.STRIPE_WEBHOOK_SECRET
        );

        const normalized = stripeService.normalizeWebhookEvent(event);

        await paymentsService.processWebhookEvent(normalized);

        return res.status(200).json({ received: true });
    },
};