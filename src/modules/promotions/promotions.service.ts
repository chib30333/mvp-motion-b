import {
    CampaignAudience,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
    UserRole,
} from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { NotFoundError } from "../../core/errors/NotFoundError.ts";

type CreatePromotionInput = {
    createdByUserId: string;
    title: string;
    content: string;
    audience: CampaignAudience;
    isActive?: boolean;
    scheduledAt?: string;
};

type UpdatePromotionInput = {
    title?: string;
    content?: string;
    audience?: CampaignAudience;
    isActive?: boolean;
    scheduledAt?: string | null;
};

const audienceToRoles: Record<CampaignAudience, UserRole[]> = {
    CUSTOMERS: [UserRole.CUSTOMER],
    PROVIDERS: [UserRole.PROVIDER],
    ALL: [UserRole.CUSTOMER, UserRole.PROVIDER],
};

export const promotionsService = {
    async list() {
        return prisma.promotionCampaign.findMany({
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string) {
        const found = await prisma.promotionCampaign.findUnique({
            where: { id },
            include: { recipients: true },
        });
        if (!found) throw new NotFoundError("Promotion not found");
        return found;
    },

    async create(input: CreatePromotionInput) {
        return prisma.promotionCampaign.create({
            data: {
                createdByUserId: input.createdByUserId,
                title: input.title,
                content: input.content,
                audience: input.audience,
                isActive: input.isActive ?? true,
                scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
            },
        });
    },

    async update(id: string, input: UpdatePromotionInput) {
        const found = await prisma.promotionCampaign.findUnique({ where: { id } });
        if (!found) throw new NotFoundError("Promotion not found");

        return prisma.promotionCampaign.update({
            where: { id },
            data: {
                ...input,
                scheduledAt:
                    input.scheduledAt === undefined
                        ? undefined
                        : input.scheduledAt
                          ? new Date(input.scheduledAt)
                          : null,
            },
        });
    },

    async send(id: string) {
        const campaign = await prisma.promotionCampaign.findUnique({ where: { id } });
        if (!campaign) throw new NotFoundError("Promotion not found");

        const roles = audienceToRoles[campaign.audience];
        const recipients = await prisma.user.findMany({
            where: { role: { in: roles }, isActive: true },
            select: { id: true },
        });

        await prisma.$transaction(async (tx) => {
            for (const r of recipients) {
                await tx.promotionRecipient.upsert({
                    where: {
                        campaignId_userId_channel: {
                            campaignId: campaign.id,
                            userId: r.id,
                            channel: NotificationChannel.IN_APP,
                        },
                    },
                    create: {
                        campaignId: campaign.id,
                        userId: r.id,
                        channel: NotificationChannel.IN_APP,
                        deliveredAt: new Date(),
                    },
                    update: { deliveredAt: new Date() },
                });

                await tx.notification.create({
                    data: {
                        userId: r.id,
                        type: NotificationType.PROMOTION,
                        channel: NotificationChannel.IN_APP,
                        status: NotificationStatus.SENT,
                        title: campaign.title,
                        message: campaign.content,
                        sentAt: new Date(),
                    },
                });
            }

            await tx.promotionCampaign.update({
                where: { id: campaign.id },
                data: { sentAt: new Date() },
            });
        });

        return { recipientsCount: recipients.length };
    },
};
