import { Prisma, ProviderApprovalStatus, ServiceStatus } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { NotFoundError } from "../../core/errors/NotFoundError.ts";
import { ForbiddenError } from "../../core/errors/ForbiddenError.ts";
import { ConflictError } from "../../core/errors/ConflictError.ts";
import { slugify } from "../../core/utils/slug.ts";
import type {
    CreateServiceInput,
    ListProviderServicesQuery,
    ListPublicServicesQuery,
    UpdateServiceInput,
} from "./services.schema.ts";
import {
    mapProviderServiceDetail,
    mapProviderServiceListItem,
    mapPublicServiceCard,
    mapPublicServiceDetail,
} from "./services.mapper.ts";

async function generateUniqueServiceSlug(title: string): Promise<string> {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 2;

    while (true) {
        const existing = await prisma.service.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!existing) return slug;

        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }
}

async function getProviderProfileOrThrow(userId: string) {
    const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId },
        select: {
            id: true,
            approvalStatus: true,
        },
    });

    if (!providerProfile) {
        throw new NotFoundError("Provider profile not found");
    }

    return providerProfile;
}

async function ensureCategoryExists(categoryId: string) {
    const category = await prisma.category.findFirst({
        where: {
            id: categoryId,
            isActive: true,
        },
        select: { id: true, name: true },
    });

    if (!category) {
        throw new NotFoundError("Category not found");
    }

    return category;
}

async function ensureCityExists(cityId: string) {
    const city = await prisma.city.findFirst({
        where: {
            id: cityId,
            isActive: true,
        },
        select: { id: true, name: true },
    });

    if (!city) {
        throw new NotFoundError("City not found");
    }

    return city;
}

async function getOwnedServiceOrThrow(serviceId: string, providerId: string) {
    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            providerId,
        },
        include: {
            category: true,
            city: true,
            images: {
                orderBy: { sortOrder: "asc" },
            },
        },
    });

    if (!service) {
        throw new NotFoundError("Service not found");
    }

    return service;
}

export const servicesService = {
    async createService(args: { userId: string; input: CreateServiceInput }) {
        const { userId, input } = args;

        const providerProfile = await getProviderProfileOrThrow(userId);

        await Promise.all([
            ensureCategoryExists(input.categoryId),
            ensureCityExists(input.cityId),
        ]);

        if (
            input.status === "ACTIVE" &&
            providerProfile.approvalStatus !== ProviderApprovalStatus.APPROVED
        ) {
            throw new ForbiddenError("Only approved providers can publish active services");
        }

        const slug = await generateUniqueServiceSlug(input.title);

        const service = await prisma.service.create({
            data: {
                providerId: providerProfile.id,
                categoryId: input.categoryId,
                cityId: input.cityId,
                title: input.title,
                slug,
                description: input.description ?? null,
                emotionTag: input.emotionTag,
                status: input.status ?? ServiceStatus.DRAFT,
                priceAmount: input.priceAmount,
                currency: "RUB",
                durationMinutes: input.durationMinutes,
                capacityDefault: input.capacityDefault,
                coverImageUrl: input.coverImageUrl ?? null,
                isFeatured: input.isFeatured ?? false,
                images: input.imageUrls?.length
                    ? {
                        create: input.imageUrls.map((imageUrl, index) => ({
                            imageUrl,
                            sortOrder: index,
                        })),
                    }
                    : undefined,
            },
            include: {
                category: true,
                city: true,
                images: {
                    orderBy: { sortOrder: "asc" },
                },
            },
        });

        return mapProviderServiceDetail(service);
    },

    async listProviderServices(args: {
        userId: string;
        query: ListProviderServicesQuery;
    }) {
        const { userId, query } = args;
        const providerProfile = await getProviderProfileOrThrow(userId);

        const { page, limit, search, status, categoryId, cityId } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ServiceWhereInput = {
            providerId: providerProfile.id,
            ...(status ? { status } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(cityId ? { cityId } : {}),
            ...(search
                ? {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {}),
        };

        const [items, total] = await Promise.all([
            prisma.service.findMany({
                where,
                include: {
                    category: true,
                    city: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.service.count({ where }),
        ]);

        return {
            items: items.map(mapProviderServiceListItem),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getProviderServiceById(args: { userId: string; serviceId: string }) {
        const { userId, serviceId } = args;
        const providerProfile = await getProviderProfileOrThrow(userId);
        const service = await getOwnedServiceOrThrow(serviceId, providerProfile.id);

        return mapProviderServiceDetail(service);
    },

    async updateService(args: {
        userId: string;
        serviceId: string;
        input: UpdateServiceInput;
    }) {
        const { userId, serviceId, input } = args;
        const providerProfile = await getProviderProfileOrThrow(userId);
        const existingService = await getOwnedServiceOrThrow(serviceId, providerProfile.id);

        if (existingService.status === ServiceStatus.ARCHIVED) {
            throw new ConflictError("Archived services cannot be edited");
        }

        if (input.categoryId) {
            await ensureCategoryExists(input.categoryId);
        }

        if (input.cityId) {
            await ensureCityExists(input.cityId);
        }

        const updatedService = await prisma.$transaction(async (tx) => {
            if (input.imageUrls) {
                await tx.serviceImage.deleteMany({
                    where: { serviceId },
                });
            }

            return tx.service.update({
                where: { id: serviceId },
                data: {
                    ...(input.title !== undefined ? { title: input.title } : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
                    ...(input.cityId !== undefined ? { cityId: input.cityId } : {}),
                    ...(input.emotionTag !== undefined ? { emotionTag: input.emotionTag } : {}),
                    ...(input.priceAmount !== undefined ? { priceAmount: input.priceAmount } : {}),
                    ...(input.durationMinutes !== undefined
                        ? { durationMinutes: input.durationMinutes }
                        : {}),
                    ...(input.capacityDefault !== undefined
                        ? { capacityDefault: input.capacityDefault }
                        : {}),
                    ...(input.coverImageUrl !== undefined
                        ? { coverImageUrl: input.coverImageUrl }
                        : {}),
                    ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
                    ...(input.imageUrls
                        ? {
                            images: {
                                create: input.imageUrls.map((imageUrl, index) => ({
                                    imageUrl,
                                    sortOrder: index,
                                })),
                            },
                        }
                        : {}),
                },
                include: {
                    category: true,
                    city: true,
                    images: {
                        orderBy: { sortOrder: "asc" },
                    },
                },
            });
        });

        return mapProviderServiceDetail(updatedService);
    },

    async updateServiceStatus(args: {
        userId: string;
        serviceId: string;
        status: ServiceStatus;
    }) {
        const { userId, serviceId, status } = args;
        const providerProfile = await getProviderProfileOrThrow(userId);
        const existingService = await getOwnedServiceOrThrow(serviceId, providerProfile.id);

        if (
            status === ServiceStatus.ACTIVE &&
            providerProfile.approvalStatus !== ProviderApprovalStatus.APPROVED
        ) {
            throw new ForbiddenError("Only approved providers can publish active services");
        }

        if (existingService.status === ServiceStatus.ARCHIVED && status !== ServiceStatus.ARCHIVED) {
            throw new ConflictError("Archived services cannot be reactivated");
        }

        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: { status },
            include: {
                category: true,
                city: true,
                images: {
                    orderBy: { sortOrder: "asc" },
                },
            },
        });

        return mapProviderServiceDetail(updatedService);
    },

    async archiveService(args: { userId: string; serviceId: string }) {
        const { userId, serviceId } = args;
        const providerProfile = await getProviderProfileOrThrow(userId);

        await getOwnedServiceOrThrow(serviceId, providerProfile.id);

        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: { status: ServiceStatus.ARCHIVED },
            include: {
                category: true,
                city: true,
                images: {
                    orderBy: { sortOrder: "asc" },
                },
            },
        });

        return mapProviderServiceDetail(updatedService);
    },

    async listPublicServices(args: { query: ListPublicServicesQuery }) {
        const { query } = args;
        const { page, limit, cityId, categoryId, emotionTag, search, sortBy } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ServiceWhereInput = {
            status: ServiceStatus.ACTIVE,
            ...(cityId ? { cityId } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(emotionTag ? { emotionTag } : {}),
            ...(search
                ? {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {}),
            category: {
                isActive: true,
            },
            city: {
                isActive: true,
            },
            provider: {
                approvalStatus: ProviderApprovalStatus.APPROVED,
            },
        };

        const orderBy: Prisma.ServiceOrderByWithRelationInput =
            sortBy === "priceAsc"
                ? { priceAmount: "asc" }
                : sortBy === "priceDesc"
                    ? { priceAmount: "desc" }
                    : { createdAt: "desc" };

        const [items, total] = await Promise.all([
            prisma.service.findMany({
                where,
                include: {
                    category: true,
                    city: true,
                    provider: true,
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.service.count({ where }),
        ]);

        return {
            items: items.map(mapPublicServiceCard),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getPublicServiceBySlug(args: { slug: string }) {
        const { slug } = args;

        const service = await prisma.service.findFirst({
            where: {
                slug,
                status: ServiceStatus.ACTIVE,
                category: {
                    isActive: true,
                },
                city: {
                    isActive: true,
                },
                provider: {
                    approvalStatus: ProviderApprovalStatus.APPROVED,
                },
            },
            include: {
                category: true,
                city: true,
                provider: true,
                images: {
                    orderBy: { sortOrder: "asc" },
                },
            },
        });

        if (!service) {
            throw new NotFoundError("Service not found");
        }

        return mapPublicServiceDetail(service);
    },
};