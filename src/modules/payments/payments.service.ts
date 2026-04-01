// src/modules/payments/payments.service.ts

import { addMonths } from 'date-fns';
import { prisma } from '../../core/db/prisma.ts';
import { ConflictError, NotFoundError } from '../../core/errors/index.ts';
import { paymentsRepository } from './payments.repository.ts';
import type {
    CreateBookingCheckoutInput,
    CreateSubscriptionCheckoutInput,
    NormalizedWebhookEvent,
} from './payment.types.ts';
import { stripeService } from './stripe/stripe.service.ts';
import { yookassaService } from './yookassa/yookassa.service.ts';

export const paymentsService = {
    async createBookingCheckout(input: CreateBookingCheckoutInput) {
        const booking = await paymentsRepository.getBookingForCheckout(
            input.bookingId,
            input.userId
        );

        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        if (booking.status !== 'PENDING_PAYMENT') {
            throw new ConflictError('Booking is not payable');
        }

        let payment = booking.payment;

        if (!payment) {
            throw new ConflictError('Payment row missing for booking');
        }

        if (payment.status === 'SUCCEEDED') {
            throw new ConflictError('Payment already succeeded');
        }

        if (payment.externalPaymentId) {
            const payload = payment.providerPayload as any;
            const existingUrl =
                payload?.url ||
                payload?.confirmation?.confirmation_url ||
                payload?.checkoutUrl;

            if (existingUrl) {
                return { checkoutUrl: existingUrl };
            }
        }

        const idempotencyKey = `booking:${booking.id}:checkout:v1`;

        const providerResult =
            input.provider === 'STRIPE'
                ? await stripeService.createBookingCheckout({
                    booking,
                    payment,
                    idempotencyKey,
                })
                : await yookassaService.createBookingCheckout({
                    booking,
                    payment,
                    idempotencyKey,
                });

        await paymentsRepository.attachExternalCheckout(payment.id, {
            externalPaymentId: providerResult.externalPaymentId,
            checkoutUrl: providerResult.checkoutUrl,
            providerPayload: {
                ...((providerResult.rawPayload as object) || {}),
                checkoutUrl: providerResult.checkoutUrl,
            },
            idempotencyKey,
        });

        return {
            checkoutUrl: providerResult.checkoutUrl,
        };
    },

    async createSubscriptionCheckout(input: CreateSubscriptionCheckoutInput) {
        const plan = await paymentsRepository.getActivePlanByCode(input.planCode);

        if (!plan) {
            throw new NotFoundError('Subscription plan not found');
        }

        const existingActive = await paymentsRepository.getActiveSubscriptionForUser(
            input.userId
        );

        if (existingActive) {
            throw new ConflictError('User already has an active subscription');
        }

        const { subscription, payment } =
            await paymentsRepository.createSubscriptionAndPayment({
                userId: input.userId,
                planId: plan.id,
                provider: input.provider,
                amount: plan.priceAmount,
                currency: plan.currency,
            });

        const idempotencyKey = `subscription:${subscription.id}:checkout:v1`;

        const providerResult =
            input.provider === 'STRIPE'
                ? await stripeService.createSubscriptionCheckout({
                    subscription,
                    payment,
                    plan,
                    idempotencyKey,
                })
                : await yookassaService.createSubscriptionCheckout({
                    subscription,
                    payment,
                    plan,
                    idempotencyKey,
                });

        await paymentsRepository.attachExternalCheckout(payment.id, {
            externalPaymentId: providerResult.externalPaymentId,
            checkoutUrl: providerResult.checkoutUrl,
            providerPayload: {
                ...((providerResult.rawPayload as object) || {}),
                checkoutUrl: providerResult.checkoutUrl,
            },
            idempotencyKey,
        });

        return {
            checkoutUrl: providerResult.checkoutUrl,
        };
    },

    async processWebhookEvent(event: NormalizedWebhookEvent) {
        const alreadyProcessed =
            await paymentsRepository.hasProcessedProviderEvent(event.providerEventId);

        if (alreadyProcessed) {
            return { ok: true, deduped: true };
        }

        const payment = await paymentsRepository.findPaymentByExternalReference({
            provider: event.provider,
            externalPaymentId: event.externalPaymentId,
            internalPaymentId: event.metadata?.internalPaymentId ?? null,
        });

        if (!payment) {
            throw new NotFoundError('Payment not found for webhook event');
        }

        await prisma.$transaction(async (tx) => {
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    providerEventId: event.providerEventId,
                    eventType: event.eventType,
                    payload: event.rawPayload as any,
                },
            });

            if (event.result === 'SUCCEEDED') {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'SUCCEEDED',
                        paidAt: new Date(),
                        failureReason: null,
                        providerPayload: event.rawPayload as any,
                    },
                });

                if (payment.type === 'BOOKING' && payment.bookingId) {
                    await tx.booking.update({
                        where: { id: payment.bookingId },
                        data: {
                            status: 'CONFIRMED',
                        },
                    });
                }

                if (payment.type === 'SUBSCRIPTION' && payment.subscriptionId) {
                    const now = new Date();
                    const periodEnd = addMonths(now, 1);

                    await tx.subscription.update({
                        where: { id: payment.subscriptionId },
                        data: {
                            status: 'ACTIVE',
                            startedAt: now,
                            currentPeriodStart: now,
                            currentPeriodEnd: periodEnd,
                        },
                    });
                }
            }

            if (event.result === 'FAILED' || event.result === 'CANCELLED') {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: event.result === 'FAILED' ? 'FAILED' : 'CANCELLED',
                        failureReason: event.failureReason ?? null,
                        providerPayload: event.rawPayload as any,
                    },
                });

                if (payment.type === 'BOOKING' && payment.bookingId) {
                    const booking = await tx.booking.findUnique({
                        where: { id: payment.bookingId },
                        include: { slot: true },
                    });

                    if (booking && booking.status === 'PENDING_PAYMENT') {
                        await tx.booking.update({
                            where: { id: booking.id },
                            data: {
                                status: 'CANCELLED',
                                cancelledAt: new Date(),
                                cancellationReason: event.failureReason ?? 'PAYMENT_FAILED',
                            },
                        });

                        await tx.slot.update({
                            where: { id: booking.slotId },
                            data: {
                                bookedCount: { decrement: 1 },
                                availableCount: { increment: 1 },
                            },
                        });
                    }
                }

                if (payment.type === 'SUBSCRIPTION' && payment.subscriptionId) {
                    await tx.subscription.update({
                        where: { id: payment.subscriptionId },
                        data: {
                            status: 'CANCELLED',
                            cancelledAt: new Date(),
                        },
                    });
                }
            }

            if (event.result === 'REFUNDED') {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'REFUNDED',
                        refundedAt: new Date(),
                        providerPayload: event.rawPayload as any,
                    },
                });

                if (payment.type === 'BOOKING' && payment.bookingId) {
                    await tx.booking.update({
                        where: { id: payment.bookingId },
                        data: {
                            status: 'REFUNDED',
                        },
                    });
                }
            }
        });

        return { ok: true };
    },
};