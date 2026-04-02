import {
    NotificationChannel,
    NotificationStatus,
    NotificationType,
    Prisma,
    ProviderApprovalStatus,
    UserRole,
} from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";

type AuthUser = {
    id: string;
    role: UserRole;
};

class ModerationService {
    private async getProviderProfileOrThrow(providerUserId: string) {
        const provider = await prisma.providerProfile.findUnique({
            where: { userId: providerUserId },
            include: {
                user: true,
                city: true,
                documents: true,
            },
        });

        if (!provider) {
            const error = new Error("Provider profile not found");
            (error as any).statusCode = 404;
            throw error;
        }

        return provider;
    }

    private validateProviderApplication(profile: {
        brandName: string;
        cityId: string;
        bio: string | null;
        addressLine: string | null;
        documents: Array<{ id: string }>;
    }) {
        const errors: string[] = [];

        if (!profile.brandName?.trim()) errors.push("Brand name is required");
        if (!profile.cityId) errors.push("City is required");
        if (!profile.bio?.trim()) errors.push("Bio is required");
        if (!profile.addressLine?.trim())
            errors.push("Address is required for moderation");
        if (!profile.documents?.length)
            errors.push("At least one verification document is required");

        if (errors.length) {
            const error = new Error(errors.join("; "));
            (error as any).statusCode = 400;
            throw error;
        }
    }

    async submitProviderApplication(currentUser: AuthUser) {
        if (currentUser.role !== UserRole.PROVIDER) {
            const error = new Error("Only providers can submit an application");
            (error as any).statusCode = 403;
            throw error;
        }

        const provider = await this.getProviderProfileOrThrow(currentUser.id);

        this.validateProviderApplication({
            brandName: provider.brandName,
            cityId: provider.cityId,
            bio: provider.bio,
            addressLine: provider.addressLine,
            documents: provider.documents,
        });

        if (provider.approvalStatus === ProviderApprovalStatus.APPROVED) {
            const error = new Error("Provider is already approved");
            (error as any).statusCode = 400;
            throw error;
        }

        const updated = await prisma.providerProfile.update({
            where: { userId: currentUser.id },
            data: {
                approvalStatus: ProviderApprovalStatus.PENDING,
                approvalSubmittedAt: new Date(),
            },
            select: {
                id: true,
                approvalStatus: true,
                approvalSubmittedAt: true,
                approvedAt: true,
                rejectedAt: true,
                rejectionReason: true,
            },
        });

        return updated;
    }

    async getMyApplicationStatus(currentUser: AuthUser) {
        if (currentUser.role !== UserRole.PROVIDER) {
            const error = new Error("Only providers can view application status");
            (error as any).statusCode = 403;
            throw error;
        }

        const provider = await prisma.providerProfile.findUnique({
            where: { userId: currentUser.id },
            select: {
                id: true,
                brandName: true,
                approvalStatus: true,
                approvalSubmittedAt: true,
                approvedAt: true,
                rejectedAt: true,
                rejectionReason: true,
                updatedAt: true,
            },
        });

        if (!provider) {
            const error = new Error("Provider profile not found");
            (error as any).statusCode = 404;
            throw error;
        }

        return provider;
    }

    async listProvidersForAdmin(params: {
        status?: ProviderApprovalStatus;
        cityId?: string;
        search?: string;
        page: number;
        limit: number;
    }) {
        const { status, cityId, search, page, limit } = params;

        const where: Prisma.ProviderProfileWhereInput = {
            ...(status ? { approvalStatus: status } : {}),
            ...(cityId ? { cityId } : {}),
            ...(search
                ? {
                    OR: [
                        { brandName: { contains: search, mode: "insensitive" } },
                        {
                            user: {
                                email: { contains: search, mode: "insensitive" },
                            },
                        },
                        {
                            user: {
                                fullName: { contains: search, mode: "insensitive" },
                            },
                        },
                    ],
                }
                : {}),
        };

        const skip = (page - 1) * limit;

        const [items, total] = await prisma.$transaction([
            prisma.providerProfile.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ approvalSubmittedAt: "asc" }, { createdAt: "asc" }],
                select: {
                    id: true,
                    brandName: true,
                    approvalStatus: true,
                    approvalSubmittedAt: true,
                    approvedAt: true,
                    rejectedAt: true,
                    rejectionReason: true,
                    createdAt: true,
                    city: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            phone: true,
                        },
                    },
                    _count: {
                        select: {
                            documents: true,
                            services: true,
                        },
                    },
                },
            }),
            prisma.providerProfile.count({ where }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getProviderModerationDetail(providerId: string) {
        const provider = await prisma.providerProfile.findUnique({
            where: { id: providerId },
            include: {
                city: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true,
                        createdAt: true,
                    },
                },
                documents: {
                    orderBy: { uploadedAt: "desc" },
                },
                services: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priceAmount: true,
                        currency: true,
                        emotionTag: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
                moderationLogs: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!provider) {
            const error = new Error("Provider not found");
            (error as any).statusCode = 404;
            throw error;
        }

        return provider;
    }

    async approveProvider(manager: AuthUser, providerId: string) {
        const provider = await prisma.providerProfile.findUnique({
            where: { id: providerId },
            select: {
                id: true,
                userId: true,
                approvalStatus: true,
            },
        });

        if (!provider) {
            const error = new Error("Provider not found");
            (error as any).statusCode = 404;
            throw error;
        }

        const approvableStatuses: ProviderApprovalStatus[] = [
            ProviderApprovalStatus.PENDING,
            ProviderApprovalStatus.REJECTED,
            ProviderApprovalStatus.SUSPENDED,
        ];

        if (!approvableStatuses.includes(provider.approvalStatus)) {
            const error = new Error(
                `Cannot approve provider from status ${provider.approvalStatus}`
            );
            (error as any).statusCode = 400;
            throw error;
        }

        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const updatedProvider = await tx.providerProfile.update({
                where: { id: providerId },
                data: {
                    approvalStatus: ProviderApprovalStatus.APPROVED,
                    approvedAt: now,
                    rejectedAt: null,
                    rejectionReason: null,
                },
                select: {
                    id: true,
                    userId: true,
                    brandName: true,
                    approvalStatus: true,
                    approvedAt: true,
                    rejectedAt: true,
                    rejectionReason: true,
                },
            });

            await tx.providerModerationLog.create({
                data: {
                    providerId,
                    managerUserId: manager.id,
                    fromStatus: provider.approvalStatus,
                    toStatus: ProviderApprovalStatus.APPROVED,
                    reason: "Approved by manager",
                },
            });

            await tx.notification.create({
                data: {
                    userId: provider.userId,
                    type: NotificationType.PROVIDER_APPROVED,
                    channel: NotificationChannel.IN_APP,
                    status: NotificationStatus.SENT,
                    title: "Provider account approved",
                    message:
                        "Your provider account has been approved. You can now publish services and receive bookings.",
                    sentAt: now,
                },
            });

            return updatedProvider;
        });

        return result;
    }

    async rejectProvider(
        manager: AuthUser,
        providerId: string,
        reason: string
    ) {
        const trimmedReason = reason.trim();

        if (!trimmedReason) {
            const error = new Error("Rejection reason is required");
            (error as any).statusCode = 400;
            throw error;
        }

        const provider = await prisma.providerProfile.findUnique({
            where: { id: providerId },
            select: {
                id: true,
                userId: true,
                approvalStatus: true,
            },
        });

        if (!provider) {
            const error = new Error("Provider not found");
            (error as any).statusCode = 404;
            throw error;
        }

        const rejectableStatuses: ProviderApprovalStatus[] = [
            ProviderApprovalStatus.PENDING,
            ProviderApprovalStatus.APPROVED,
            ProviderApprovalStatus.SUSPENDED,
        ];

        if (!rejectableStatuses.includes(provider.approvalStatus)) {
            const error = new Error(
                `Cannot reject provider from status ${provider.approvalStatus}`
            );
            (error as any).statusCode = 400;
            throw error;
        }

        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const updatedProvider = await tx.providerProfile.update({
                where: { id: providerId },
                data: {
                    approvalStatus: ProviderApprovalStatus.REJECTED,
                    rejectedAt: now,
                    rejectionReason: trimmedReason,
                },
                select: {
                    id: true,
                    userId: true,
                    brandName: true,
                    approvalStatus: true,
                    approvedAt: true,
                    rejectedAt: true,
                    rejectionReason: true,
                },
            });

            await tx.providerModerationLog.create({
                data: {
                    providerId,
                    managerUserId: manager.id,
                    fromStatus: provider.approvalStatus,
                    toStatus: ProviderApprovalStatus.REJECTED,
                    reason: trimmedReason,
                },
            });

            await tx.notification.create({
                data: {
                    userId: provider.userId,
                    type: NotificationType.PROVIDER_REJECTED,
                    channel: NotificationChannel.IN_APP,
                    status: NotificationStatus.SENT,
                    title: "Provider application rejected",
                    message: `Your provider application was rejected. Reason: ${trimmedReason}`,
                    sentAt: now,
                },
            });

            return updatedProvider;
        });

        return result;
    }
}

export default new ModerationService();