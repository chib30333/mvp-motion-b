// src/modules/payments/stripe/stripe.client.ts

import Stripe from 'stripe';
import { env } from '../../../config/env.ts';

export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});