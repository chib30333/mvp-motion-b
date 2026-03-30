import { prisma } from "../../core/db/prisma.ts";
import { BadRequestError } from "../../core/errors/BadRequestError.ts";
import { ForbiddenError } from "../../core/errors/ForbiddenError.ts";
import { NotFoundError } from "../../core/errors/NotFoundError.ts";
import { mapCustomerProfile } from "./customerProfile.mapper.ts";
import { UserRole } from "@prisma/client";

type UpdateCustomerProfileInput = {
    age?: number;
    cityId?: string;
    moodNotes?: string;
    preferredRadiusKm?: number;
};

type OnboardingInput = {
    age: number;
    cityId: string;
    moodNotes?: string;
    preferredRadiusKm?: number;
    emotionPreferences: {
        emotion: any;
        score: number;
    }[];
};

const assertCustomerRole = (role: UserRole) => {
    if (role !== UserRole.CUSTOMER) {
        throw new ForbiddenError("Only customers can access customer profile endpoints");
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

export const customerProfileService = {
    async getMe(userId: string, role: UserRole) {
        assertCustomerRole(role);

        const profile = await prisma.customerProfile.findUnique({
            where: { userId },
            include: {
                city: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                preferences: {
                    select: {
                        emotion: true,
                        score: true,
                    },
                    orderBy: {
                        emotion: "asc",
                    },
                },
            },
        });

        if (!profile) {
            return null;
        }

        return mapCustomerProfile(profile);
    },

    async updateMe(userId: string, role: UserRole, input: UpdateCustomerProfileInput) {
        assertCustomerRole(role);

        if (input.cityId) {
            await ensureCityExists(input.cityId);
        }

        const profile = await prisma.customerProfile.upsert({
            where: { userId },
            update: {
                ...(input.age !== undefined && { age: input.age }),
                ...(input.cityId !== undefined && { cityId: input.cityId }),
                ...(input.moodNotes !== undefined && { moodNotes: input.moodNotes }),
                ...(input.preferredRadiusKm !== undefined && {
                    preferredRadiusKm: input.preferredRadiusKm,
                }),
            },
            create: {
                userId,
                age: input.age ?? null,
                cityId: input.cityId ?? null,
                moodNotes: input.moodNotes ?? null,
                preferredRadiusKm: input.preferredRadiusKm ?? null,
                onboardingDone: false,
            },
            include: {
                city: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                preferences: {
                    select: {
                        emotion: true,
                        score: true,
                    },
                    orderBy: {
                        emotion: "asc",
                    },
                },
            },
        });

        return mapCustomerProfile(profile);
    },

    async submitOnboarding(userId: string, role: UserRole, input: OnboardingInput) {
        assertCustomerRole(role);

        await ensureCityExists(input.cityId);

        const result = await prisma.$transaction(async (tx) => {
            const profile = await tx.customerProfile.upsert({
                where: { userId },
                update: {
                    age: input.age,
                    cityId: input.cityId,
                    moodNotes: input.moodNotes ?? null,
                    preferredRadiusKm: input.preferredRadiusKm ?? null,
                    onboardingDone: true,
                },
                create: {
                    userId,
                    age: input.age,
                    cityId: input.cityId,
                    moodNotes: input.moodNotes ?? null,
                    preferredRadiusKm: input.preferredRadiusKm ?? null,
                    onboardingDone: true,
                },
            });

            await tx.customerEmotionPreference.deleteMany({
                where: { customerProfileId: profile.id },
            });

            await tx.customerEmotionPreference.createMany({
                data: input.emotionPreferences.map((item) => ({
                    customerProfileId: profile.id,
                    emotion: item.emotion,
                    score: item.score,
                })),
            });

            const fullProfile = await tx.customerProfile.findUnique({
                where: { id: profile.id },
                include: {
                    city: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    preferences: {
                        select: {
                            emotion: true,
                            score: true,
                        },
                        orderBy: {
                            emotion: "asc",
                        },
                    },
                },
            });

            if (!fullProfile) {
                throw new NotFoundError("Customer profile was not found after onboarding save");
            }

            return fullProfile;
        });

        return mapCustomerProfile(result);
    },
};