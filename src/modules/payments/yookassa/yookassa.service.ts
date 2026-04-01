// src/modules/payments/yookassa/yookassa.service.ts

import { yookassaClient } from './yookassa.client.ts';
import type {
    CheckoutCreationResult,
    NormalizedWebhookEvent,
} from '../payment.types.ts';

export const yookassaService = {
    async createBookingCheckout(input: {
        booking: any;
        payment: any;
        idempotencyKey: string;
    }): Promise<CheckoutCreationResult> {
        const serviceTitle = input.booking.slot.service.title;

        const response = await yookassaClient.post(
            '/payments',
            {
                amount: {
                    value: (input.payment.amount / 100).toFixed(2),
                    currency: input.payment.currency,
                },
                capture: true,
                confirmation: {
                    type: 'redirect',
                    return_url: `${process.env.FRONTEND_URL}/payments/success?bookingId=${input.booking.id}`,
                },
                description: `Booking payment for ${serviceTitle}`,
                metadata: {
                    internalPaymentId: input.payment.id,
                    bookingId: input.booking.id,
                    userId: input.booking.userId,
                    type: 'BOOKING',
                },
            },
            {
                headers: {
                    'Idempotence-Key': input.idempotencyKey,
                },
            }
        );

        return {
            externalPaymentId: response.data.id,
            checkoutUrl: response.data.confirmation.confirmation_url,
            rawPayload: response.data,
        };
    },

    async createSubscriptionCheckout(input: {
        subscription: any;
        payment: any;
        plan: any;
        idempotencyKey: string;
    }): Promise<CheckoutCreationResult> {
        const response = await yookassaClient.post(
            '/payments',
            {
                amount: {
                    value: (input.payment.amount / 100).toFixed(2),
                    currency: input.payment.currency,
                },
                capture: true,
                confirmation: {
                    type: 'redirect',
                    return_url: `${process.env.FRONTEND_URL}/subscription/success?subscriptionId=${input.subscription.id}`,
                },
                description: `Subscription payment for ${input.plan.name}`,
                metadata: {
                    internalPaymentId: input.payment.id,
                    subscriptionId: input.subscription.id,
                    userId: input.subscription.userId,
                    type: 'SUBSCRIPTION',
                    planCode: input.plan.code,
                },
            },
            {
                headers: {
                    'Idempotence-Key': input.idempotencyKey,
                },
            }
        );

        return {
            externalPaymentId: response.data.id,
            checkoutUrl: response.data.confirmation.confirmation_url,
            rawPayload: response.data,
        };
    },

    normalizeWebhookEvent(payload: any): NormalizedWebhookEvent {
        const object = payload.object;
        const metadata = object.metadata ?? {};

        let result: 'SUCCEEDED' | 'FAILED' | 'CANCELLED' = 'FAILED';

        if (object.status === 'succeeded') result = 'SUCCEEDED';
        if (object.status === 'canceled') result = 'CANCELLED';
        if (object.status === 'waiting_for_capture') result = 'FAILED';

        return {
            provider: 'YOOKASSA',
            providerEventId: payload.event,
            eventType: payload.event,
            externalPaymentId: object.id,
            result,
            metadata: {
                internalPaymentId: metadata.internalPaymentId,
                bookingId: metadata.bookingId,
                subscriptionId: metadata.subscriptionId,
                userId: metadata.userId,
                type: metadata.type,
            },
            failureReason: result === 'FAILED' ? 'YOOKASSA_PAYMENT_NOT_SUCCEEDED' : null,
            rawPayload: payload,
        };
    },
};