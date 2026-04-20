// src/modules/payments/stripe/stripe.client.ts

import Stripe from 'stripe';
import { env } from '../../../config/env.ts';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe is not configured');
    }

    stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY);

    return stripeClient;
}
