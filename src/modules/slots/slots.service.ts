import { Prisma } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from "../../core/errors/index.ts";
import type { CreateSlotInput, UpdateSlotInput } from "./slots.schema.ts";

function parseFutureDate(value: string, fieldName: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new ValidationError(`${fieldName} is invalid`);
    }

    return date;
}

function ensureDateRangeValid(startsAt: Date, endsAt: Date) {
    const now = new Date();

    if (startsAt <= now) {
        throw new ValidationError("Slot start time must be in the future");
    }

    if (endsAt <= startsAt) {
        throw new ValidationError("Slot end time must be after start time");
    }
}

async function getApprovedProviderOrThrow(userId: string) {
    const provider = await prisma.providerProfile.findUnique({
        where: { userId },
    });

    if (!provider) {
        throw new ForbiddenError("Provider profile not found");
    }

    if (provider.approvalStatus !== "APPROVED") {
        throw new ForbiddenError("Provider is not approved");
    }

    return provider;
}

async function getOwnedActiveServiceOrThrow(serviceId: string, providerId: string) {
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
    });

    if (!service) {
        throw new NotFoundError("Service not found");
    }

    if (service.providerId !== providerId) {
        throw new ForbiddenError("You can only manage slots for your own services");
    }

    if (service.status !== "ACTIVE") {
        throw new ConflictError("Slots can only be created for active services");
    }

    return service;
}

async function ensureNoOverlappingSlot(params: {
    providerId: string;
    startsAt: Date;
    endsAt: Date;
    excludeSlotId?: string;
}) {
    const overlappingSlot = await prisma.slot.findFirst({
        where: {
            providerId: params.providerId,
            status: "ACTIVE",
            ...(params.excludeSlotId
                ? { id: { not: params.excludeSlotId } }
                : {}),
            AND: [
                { startsAt: { lt: params.endsAt } },
                { endsAt: { gt: params.startsAt } },
            ],
        },
        select: { id: true },
    });

    if (overlappingSlot) {
        throw new ConflictError("This slot overlaps with another active slot");
    }
}

export async function createSlot(userId: string, input: CreateSlotInput) {
    const provider = await getApprovedProviderOrThrow(userId);
    const service = await getOwnedActiveServiceOrThrow(input.serviceId, provider.id);

    const startsAt = parseFutureDate(input.startsAt, "startsAt");
    const endsAt = parseFutureDate(input.endsAt, "endsAt");

    ensureDateRangeValid(startsAt, endsAt);

    await ensureNoOverlappingSlot({
        providerId: provider.id,
        startsAt,
        endsAt,
    });

    const slot = await prisma.slot.create({
        data: {
            serviceId: service.id,
            providerId: provider.id,
            cityId: service.cityId,
            startsAt,
            endsAt,
            status: "ACTIVE",
            emotionTag: input.emotionTag ?? service.emotionTag,
            capacity: input.capacity,
            bookedCount: 0,
            availableCount: input.capacity,
            priceAmount: input.priceAmount,
            currency: service.currency,
            notes: input.notes ?? null,
        },
        include: {
            service: {
                select: {
                    title: true,
                },
            },
        },
    });

    return slot;
}

export async function updateSlot(
    userId: string,
    slotId: string,
    input: UpdateSlotInput
) {
    const provider = await getApprovedProviderOrThrow(userId);

    const slot = await prisma.slot.findUnique({
        where: { id: slotId },
        include: {
            service: true,
        },
    });

    if (!slot) {
        throw new NotFoundError("Slot not found");
    }

    if (slot.providerId !== provider.id) {
        throw new ForbiddenError("You can only update your own slots");
    }

    if (slot.status !== "ACTIVE") {
        throw new ConflictError("Only active slots can be updated");
    }

    const hasBookings = slot.bookedCount > 0;

    const nextStartsAt = input.startsAt
        ? parseFutureDate(input.startsAt, "startsAt")
        : slot.startsAt;

    const nextEndsAt = input.endsAt
        ? parseFutureDate(input.endsAt, "endsAt")
        : slot.endsAt;

    ensureDateRangeValid(nextStartsAt, nextEndsAt);

    if (hasBookings) {
        const timeChanged =
            nextStartsAt.getTime() !== slot.startsAt.getTime() ||
            nextEndsAt.getTime() !== slot.endsAt.getTime();

        if (timeChanged) {
            throw new ConflictError(
                "You cannot change slot time after bookings already exist"
            );
        }

        if (
            typeof input.priceAmount === "number" &&
            input.priceAmount !== slot.priceAmount
        ) {
            throw new ConflictError(
                "You cannot change price after bookings already exist"
            );
        }
    }

    let nextCapacity = slot.capacity;
    let nextAvailableCount = slot.availableCount;

    if (typeof input.capacity === "number") {
        if (input.capacity < slot.bookedCount) {
            throw new ConflictError(
                "Capacity cannot be less than booked count"
            );
        }

        nextCapacity = input.capacity;
        nextAvailableCount = input.capacity - slot.bookedCount;
    }

    await ensureNoOverlappingSlot({
        providerId: provider.id,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        excludeSlotId: slot.id,
    });

    const updatedSlot = await prisma.slot.update({
        where: { id: slot.id },
        data: {
            startsAt: nextStartsAt,
            endsAt: nextEndsAt,
            capacity: nextCapacity,
            availableCount: nextAvailableCount,
            priceAmount: input.priceAmount ?? slot.priceAmount,
            emotionTag: input.emotionTag ?? slot.emotionTag,
            notes:
                input.notes !== undefined
                    ? input.notes
                    : slot.notes,
        },
        include: {
            service: {
                select: {
                    title: true,
                },
            },
        },
    });

    return updatedSlot;
}

export async function cancelSlot(userId: string, slotId: string) {
    const provider = await getApprovedProviderOrThrow(userId);

    const slot = await prisma.slot.findUnique({
        where: { id: slotId },
        include: {
            service: {
                select: {
                    title: true,
                },
            },
        },
    });

    if (!slot) {
        throw new NotFoundError("Slot not found");
    }

    if (slot.providerId !== provider.id) {
        throw new ForbiddenError("You can only cancel your own slots");
    }

    if (slot.status === "CANCELLED") {
        throw new ConflictError("Slot is already cancelled");
    }

    if (slot.bookedCount > 0) {
        throw new ConflictError(
            "You cannot cancel a slot that already has bookings"
        );
    }

    const cancelledSlot = await prisma.slot.update({
        where: { id: slot.id },
        data: {
            status: "CANCELLED",
        },
        include: {
            service: {
                select: {
                    title: true,
                },
            },
        },
    });

    return cancelledSlot;
}

export async function getProviderSlots(
    userId: string,
    query: Record<string, unknown>
) {
    const provider = await getApprovedProviderOrThrow(userId);

    const where: Prisma.SlotWhereInput = {
        providerId: provider.id,
    };

    if (query.serviceId && typeof query.serviceId === "string") {
        where.serviceId = query.serviceId;
    }

    if (query.status && typeof query.status === "string") {
        where.status = query.status as any;
    }

    if (query.from || query.to) {
        where.startsAt = {};

        if (query.from && typeof query.from === "string") {
            where.startsAt.gte = new Date(query.from);
        }

        if (query.to && typeof query.to === "string") {
            where.startsAt.lte = new Date(query.to);
        }
    }

    return prisma.slot.findMany({
        where,
        orderBy: {
            startsAt: "asc",
        },
        include: {
            service: {
                select: {
                    title: true,
                },
            },
        },
    });
}

export async function getPublicServiceSlots(
    serviceId: string,
    query: Record<string, unknown>
) {
    const now = new Date();

    const startsAtFilter: Prisma.DateTimeFilter = {};

    if (query.from && typeof query.from === "string") {
        startsAtFilter.gte = new Date(query.from);
    } else {
        startsAtFilter.gt = now;
    }

    if (query.to && typeof query.to === "string") {
        startsAtFilter.lte = new Date(query.to);
    }

    const where: Prisma.SlotWhereInput = {
        serviceId,
        status: "ACTIVE",
        startsAt: startsAtFilter,
        availableCount: {
            gt: 0,
        },
        service: {
            status: "ACTIVE",
            provider: {
                approvalStatus: "APPROVED",
            },
        },
    };

    return prisma.slot.findMany({
        where,
        orderBy: {
            startsAt: "asc",
        },
    });
}