import { ProviderApprovalStatus, UserRole } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { BadRequestError } from "../../core/errors/BadRequestError.ts";
import { ForbiddenError } from "../../core/errors/ForbiddenError.ts";
import { NotFoundError } from "../../core/errors/NotFoundError.ts";
import { mapProviderProfile } from "./providers.mapper.ts";

type UpdateProviderInput = {
    brandName?: string;
    bio?: string;
    cityId?: string;
    addressLine?: string;
    latitude?: number;
    longitude?: number;
    websiteUrl?: string;
    instagramUrl?: string;
    includeInJoyMap?: boolean;
};

const assertProviderRole = (role: UserRole) => {
    if (role !== UserRole.PROVIDER) {
        throw new ForbiddenError("Only providers can access provider profile endpoints");
    }
};

const ensureCityExists = async (cityId: string) => {
    const city = await prisma.city.findFirst({
        where: {
            id: cityId,
            isActive: true,
        },
    });

    if (!city) {
        throw new BadRequestError("Selected city does not exist or is inactive");
    }

    return city;
};

const normalizeOptionalUrl = (value?: string) => {
    if (value === undefined) return undefined;
    if (value.trim() === "") return null;
    return value.trim();
};

export const providersService = {
    async getMe(userId: string, role: UserRole) {
        assertProviderRole(role);

        const profile = await prisma.providerProfile.findUnique({
            where: { userId },
            include: {
                city: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!profile) {
            return null;
        }

        return mapProviderProfile(profile);
    },

    async updateMe(userId: string, role: UserRole, input: UpdateProviderInput) {
        assertProviderRole(role);

        if (input.cityId) {
            await ensureCityExists(input.cityId);
        }

        const existingProfile = await prisma.providerProfile.findUnique({
            where: { userId },
        });

        if (!existingProfile) {
            if (!input.cityId) {
                throw new BadRequestError("cityId is required when creating provider profile");
            }

            if (!input.brandName) {
                throw new BadRequestError("brandName is required when creating provider profile");
            }

            const created = await prisma.providerProfile.create({
                data: {
                    userId,
                    brandName: input.brandName.trim(),
                    bio: input.bio?.trim() || null,
                    cityId: input.cityId,
                    addressLine: input.addressLine?.trim() || null,
                    latitude: input.latitude ?? null,
                    longitude: input.longitude ?? null,
                    websiteUrl: normalizeOptionalUrl(input.websiteUrl) ?? null,
                    instagramUrl: normalizeOptionalUrl(input.instagramUrl) ?? null,
                    includeInJoyMap: input.includeInJoyMap ?? false,
                    approvalStatus: ProviderApprovalStatus.DRAFT,
                },
                include: {
                    city: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            });

            return mapProviderProfile(created);
        }

        const updated = await prisma.providerProfile.update({
            where: { userId },
            data: {
                ...(input.brandName !== undefined && { brandName: input.brandName.trim() }),
                ...(input.bio !== undefined && { bio: input.bio.trim() || null }),
                ...(input.cityId !== undefined && { cityId: input.cityId }),
                ...(input.addressLine !== undefined && {
                    addressLine: input.addressLine.trim() || null,
                }),
                ...(input.latitude !== undefined && { latitude: input.latitude }),
                ...(input.longitude !== undefined && { longitude: input.longitude }),
                ...(input.websiteUrl !== undefined && {
                    websiteUrl: normalizeOptionalUrl(input.websiteUrl),
                }),
                ...(input.instagramUrl !== undefined && {
                    instagramUrl: normalizeOptionalUrl(input.instagramUrl),
                }),
                ...(input.includeInJoyMap !== undefined && {
                    includeInJoyMap: input.includeInJoyMap,
                }),
            },
            include: {
                city: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        return mapProviderProfile(updated);
    },

    async submitForApproval(userId: string, role: UserRole) {
        assertProviderRole(role);

        const profile = await prisma.providerProfile.findUnique({
            where: { userId },
            include: {
                city: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        if (!profile) {
            throw new NotFoundError("Provider profile not found");
        }

        if (!profile.brandName || profile.brandName.trim().length < 2) {
            throw new BadRequestError("Brand name is required before submission");
        }

        if (!profile.cityId) {
            throw new BadRequestError("City is required before submission");
        }

        if (!profile.addressLine || profile.addressLine.trim().length < 3) {
            throw new BadRequestError("Address is required before submission");
        }

        if (profile.approvalStatus === ProviderApprovalStatus.PENDING) {
            throw new BadRequestError("Provider profile is already pending review");
        }

        if (profile.approvalStatus === ProviderApprovalStatus.APPROVED) {
            throw new BadRequestError("Provider profile is already approved");
        }

        if (profile.cityId) {
            await ensureCityExists(profile.cityId);
        }

        const updatedProfile = await prisma.providerProfile.update({
            where: { userId },
            data: {
                approvalStatus: ProviderApprovalStatus.PENDING,
                approvalSubmittedAt: new Date(),
                rejectedAt: null,
                rejectionReason: null,
            },
            include: {
                city: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        return mapProviderProfile(updatedProfile);
    },
};