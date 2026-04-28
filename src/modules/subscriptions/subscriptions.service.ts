import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { NotFoundError } from "../../core/errors/NotFoundError.ts";

export const subscriptionsService = {
    async listPlans() {
        return prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { priceAmount: "asc" },
        });
    },

    async getMyActiveSubscription(userId: string) {
        return prisma.subscription.findFirst({
            where: {
                userId,
                status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
            },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
        });
    },

    async listMine(userId: string) {
        return prisma.subscription.findMany({
            where: { userId },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
        });
    },

    async cancelMine(userId: string, immediate: boolean) {
        const active = await prisma.subscription.findFirst({
            where: {
                userId,
                status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!active) throw new NotFoundError("No active subscription found");

        if (immediate) {
            return prisma.subscription.update({
                where: { id: active.id },
                data: {
                    status: SubscriptionStatus.CANCELLED,
                    cancelledAt: new Date(),
                    endedAt: new Date(),
                },
            });
        }

        return prisma.subscription.update({
            where: { id: active.id },
            data: { cancelAtPeriodEnd: true },
        });
    },
};
