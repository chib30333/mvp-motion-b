// src/modules/payments/payments.repository.ts

import { prisma } from '../../core/db/prisma.ts';

export const paymentsRepository = {
    async getBookingForCheckout(bookingId: string, userId: string) {
        return prisma.booking.findFirst({
            where: {
                id: bookingId,
                userId,
            },
            include: {
                slot: {
                    include: {
                        service: true,
                        provider: true,
                    },
                },
                payment: true,
            },
        });
    },

    async getPaymentByBookingId(bookingId: string) {
        return prisma.payment.findFirst({
            where: { bookingId },
        });
    },

    async getActivePlanByCode(code: string) {
        return prisma.subscriptionPlan.findFirst({
            where: {
                code,
                isActive: true,
            },
        });
    },

    async getActiveSubscriptionForUser(userId: string) {
        return prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    async attachExternalCheckout(
        paymentId: string,
        data: {
            externalPaymentId: string;
            checkoutUrl?: string | null;
            providerPayload?: unknown;
            idempotencyKey: string;
        }
    ) {
        return prisma.payment.update({
            where: { id: paymentId },
            data: {
                externalPaymentId: data.externalPaymentId,
                providerPayload: data.providerPayload as any,
                idempotencyKey: data.idempotencyKey,
            },
        });
    },

    async hasProcessedProviderEvent(providerEventId: string) {
        const event = await prisma.paymentEvent.findFirst({
            where: { providerEventId },
            select: { id: true },
        });

        return Boolean(event);
    },

    async findPaymentByExternalReference(input: {
        provider: 'STRIPE' | 'YOOKASSA';
        externalPaymentId?: string | null;
        internalPaymentId?: string | null;
    }) {
        if (input.internalPaymentId) {
            return prisma.payment.findFirst({
                where: {
                    id: input.internalPaymentId,
                    provider: input.provider,
                },
            });
        }

        if (input.externalPaymentId) {
            return prisma.payment.findFirst({
                where: {
                    externalPaymentId: input.externalPaymentId,
                    provider: input.provider,
                },
            });
        }

        return null;
    },

    async createSubscriptionAndPayment(input: {
        userId: string;
        planId: string;
        provider: 'STRIPE' | 'YOOKASSA';
        amount: number;
        currency: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const subscription = await tx.subscription.create({
                data: {
                    userId: input.userId,
                    planId: input.planId,
                    provider: input.provider,
                    status: 'INCOMPLETE',
                },
            });

            const payment = await tx.payment.create({
                data: {
                    userId: input.userId,
                    subscriptionId: subscription.id,
                    type: 'SUBSCRIPTION',
                    provider: input.provider,
                    status: 'PENDING',
                    amount: input.amount,
                    currency: input.currency,
                },
            });

            return { subscription, payment };
        });
    },
};