import {
    NotificationChannel,
    NotificationStatus,
    NotificationType,
    Prisma,
} from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { ForbiddenError } from "../../core/errors/ForbiddenError.ts";
import { NotFoundError } from "../../core/errors/NotFoundError.ts";

type ListMineInput = {
    userId: string;
    unreadOnly?: boolean;
    page: number;
    pageSize: number;
};

type DispatchInput = {
    userId: string;
    type: NotificationType;
    channel?: NotificationChannel;
    title: string;
    message: string;
    payload?: Record<string, unknown>;
};

export const notificationsService = {
    async listMine(input: ListMineInput) {
        const where: Prisma.NotificationWhereInput = { userId: input.userId };
        if (input.unreadOnly) {
            where.readAt = null;
        }

        const [items, total, unread] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (input.page - 1) * input.pageSize,
                take: input.pageSize,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { userId: input.userId, readAt: null },
            }),
        ]);

        return {
            items,
            meta: {
                page: input.page,
                pageSize: input.pageSize,
                total,
                totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
                unread,
            },
        };
    },

    async markRead(userId: string, id: string) {
        const found = await prisma.notification.findUnique({ where: { id } });
        if (!found) throw new NotFoundError("Notification not found");
        if (found.userId !== userId) throw new ForbiddenError("Not your notification");

        return prisma.notification.update({
            where: { id },
            data: { readAt: new Date(), status: NotificationStatus.READ },
        });
    },

    async markAllRead(userId: string) {
        const result = await prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date(), status: NotificationStatus.READ },
        });
        return { count: result.count };
    },

    async dispatch(input: DispatchInput) {
        return prisma.notification.create({
            data: {
                userId: input.userId,
                type: input.type,
                channel: input.channel ?? NotificationChannel.IN_APP,
                status: NotificationStatus.SENT,
                title: input.title,
                message: input.message,
                payload: (input.payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
                sentAt: new Date(),
            },
        });
    },
};
