// src/modules/payments/stripe/stripe.service.ts

import { stripeClient } from './stripe.client.ts';
import type {
    CheckoutCreationResult,
    NormalizedWebhookEvent,
} from '../payment.types.ts';

export const stripeService = {
    async createBookingCheckout(input: {
        booking: any;
        payment: any;
        idempotencyKey: string;
    }): Promise<CheckoutCreationResult> {
        const booking = input.booking;
        const slot = booking.slot;
        const service = slot.service;

        const session = await stripeClient.checkout.sessions.create(
            {
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/payments/success?bookingId=${booking.id}`,
                cancel_url: `${process.env.FRONTEND_URL}/payments/cancel?bookingId=${booking.id}`,
                client_reference_id: input.payment.id,
                metadata: {
                    internalPaymentId: input.payment.id,
                    bookingId: booking.id,
                    userId: booking.userId,
                    type: 'BOOKING',
                },
                line_items: [
                    {
                        price_data: {
                            currency: input.payment.currency.toLowerCase(),
                            product_data: {
                                name: service.title,
                                description: `Booking for ${service.title}`,
                            },
                            unit_amount: input.payment.amount,
                        },
                        quantity: 1,
                    },
                ],
            },
            {
                idempotencyKey: input.idempotencyKey,
            }
        );

        return {
            externalPaymentId: session.id,
            checkoutUrl: session.url!,
            rawPayload: session,
        };
    },

    async createSubscriptionCheckout(input: {
        subscription: any;
        payment: any;
        plan: any;
        idempotencyKey: string;
    }): Promise<CheckoutCreationResult> {
        const session = await stripeClient.checkout.sessions.create(
            {
                mode: 'subscription',
                success_url: `${process.env.FRONTEND_URL}/subscription/success?subscriptionId=${input.subscription.id}`,
                cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel?subscriptionId=${input.subscription.id}`,
                client_reference_id: input.payment.id,
                metadata: {
                    internalPaymentId: input.payment.id,
                    subscriptionId: input.subscription.id,
                    userId: input.subscription.userId,
                    type: 'SUBSCRIPTION',
                    planCode: input.plan.code,
                },
                line_items: [
                    {
                        price_data: {
                            currency: input.plan.currency.toLowerCase(),
                            product_data: {
                                name: input.plan.name,
                                description: input.plan.description ?? 'Subscription plan',
                            },
                            recurring: {
                                interval: 'month',
                                interval_count: input.plan.intervalMonths || 1,
                            },
                            unit_amount: input.plan.priceAmount,
                        },
                        quantity: 1,
                    },
                ],
            },
            {
                idempotencyKey: input.idempotencyKey,
            }
        );

        return {
            externalPaymentId: session.id,
            checkoutUrl: session.url!,
            rawPayload: session,
        };
    },

    constructWebhookEvent(rawBody: Buffer, signature: string, secret: string) {
        return stripeClient.webhooks.constructEvent(rawBody, signature, secret);
    },

    normalizeWebhookEvent(event: any): NormalizedWebhookEvent {
        const object = event.data.object;

        switch (event.type) {
            case 'checkout.session.completed':
                return {
                    provider: 'STRIPE',
                    providerEventId: event.id,
                    eventType: event.type,
                    externalPaymentId: object.id,
                    result: 'SUCCEEDED',
                    metadata: {
                        internalPaymentId: object.metadata?.internalPaymentId,
                        bookingId: object.metadata?.bookingId,
                        subscriptionId: object.metadata?.subscriptionId,
                        userId: object.metadata?.userId,
                        type: object.metadata?.type,
                    },
                    rawPayload: event,
                };

            case 'checkout.session.async_payment_failed':
                return {
                    provider: 'STRIPE',
                    providerEventId: event.id,
                    eventType: event.type,
                    externalPaymentId: object.id,
                    result: 'FAILED',
                    metadata: {
                        internalPaymentId: object.metadata?.internalPaymentId,
                        bookingId: object.metadata?.bookingId,
                        subscriptionId: object.metadata?.subscriptionId,
                        userId: object.metadata?.userId,
                        type: object.metadata?.type,
                    },
                    failureReason: 'ASYNC_PAYMENT_FAILED',
                    rawPayload: event,
                };

            case 'checkout.session.expired':
                return {
                    provider: 'STRIPE',
                    providerEventId: event.id,
                    eventType: event.type,
                    externalPaymentId: object.id,
                    result: 'CANCELLED',
                    metadata: {
                        internalPaymentId: object.metadata?.internalPaymentId,
                        bookingId: object.metadata?.bookingId,
                        subscriptionId: object.metadata?.subscriptionId,
                        userId: object.metadata?.userId,
                        type: object.metadata?.type,
                    },
                    failureReason: 'CHECKOUT_SESSION_EXPIRED',
                    rawPayload: event,
                };

            default:
                return {
                    provider: 'STRIPE',
                    providerEventId: event.id,
                    eventType: event.type,
                    externalPaymentId: object?.id ?? null,
                    result: 'CANCELLED',
                    rawPayload: event,
                };
        }
    },
};