import { Prisma, BookingStatus } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";

const bookingInclude = {
    slot: {
        include: {
            service: true,
            provider: true,
        },
    },
    payment: true,
} satisfies Prisma.BookingInclude;

export class BookingsRepository {
    async findSlotForBooking(tx: Prisma.TransactionClient, slotId: string) {
        return tx.slot.findUnique({
            where: { id: slotId },
            include: {
                service: true,
                provider: true,
            },
        });
    }

    async findActiveBookingForUserAndSlot(
        tx: Prisma.TransactionClient,
        userId: string,
        slotId: string
    ) {
        return tx.booking.findFirst({
            where: {
                userId,
                slotId,
                status: {
                    in: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED],
                },
            },
        });
    }

    async reserveSlotInventory(tx: Prisma.TransactionClient, slotId: string) {
        return tx.slot.updateMany({
            where: {
                id: slotId,
                status: "ACTIVE",
                availableCount: { gt: 0 },
            },
            data: {
                bookedCount: { increment: 1 },
                availableCount: { decrement: 1 },
            },
        });
    }

    async releaseSlotInventory(tx: Prisma.TransactionClient, slotId: string) {
        return tx.slot.update({
            where: { id: slotId },
            data: {
                bookedCount: { decrement: 1 },
                availableCount: { increment: 1 },
            },
        });
    }

    async createPendingBooking(
        tx: Prisma.TransactionClient,
        data: {
            userId: string;
            slotId: string;
            totalAmount: number;
            currency: string;
            notes?: string;
            paymentExpiresAt: Date;
        }
    ) {
        return tx.booking.create({
            data: {
                userId: data.userId,
                slotId: data.slotId,
                status: BookingStatus.PENDING_PAYMENT,
                totalAmount: data.totalAmount,
                currency: data.currency,
                notes: data.notes,
                paymentExpiresAt: data.paymentExpiresAt,
            },
            include: bookingInclude,
        });
    }

    async findBookingByIdForUser(tx: Prisma.TransactionClient, bookingId: string, userId: string) {
        return tx.booking.findFirst({
            where: {
                id: bookingId,
                userId,
            },
            include: bookingInclude,
        });
    }

    async findBookingById(bookingId: string) {
        return prisma.booking.findUnique({
            where: { id: bookingId },
            include: bookingInclude,
        });
    }

    async updateBookingCancelled(
        tx: Prisma.TransactionClient,
        bookingId: string,
        data: {
            cancelledAt: Date;
            cancellationReason?: string;
            refundAmount?: number;
        }
    ) {
        return tx.booking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CANCELLED,
                cancelledAt: data.cancelledAt,
                cancellationReason: data.cancellationReason,
                refundAmount: data.refundAmount ?? 0,
            },
            include: bookingInclude,
        });
    }

    async findCustomerBookings(userId: string, filters?: { status?: BookingStatus; upcomingOnly?: boolean }) {
        return prisma.booking.findMany({
            where: {
                userId,
                ...(filters?.status ? { status: filters.status } : {}),
                ...(filters?.upcomingOnly
                    ? {
                        slot: {
                            startsAt: { gte: new Date() },
                        },
                    }
                    : {}),
            },
            include: bookingInclude,
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async findCustomerBookingById(userId: string, bookingId: string) {
        return prisma.booking.findFirst({
            where: {
                id: bookingId,
                userId,
            },
            include: bookingInclude,
        });
    }

    async findProviderBookings(providerId: string, filters?: { status?: BookingStatus; upcomingOnly?: boolean }) {
        return prisma.booking.findMany({
            where: {
                slot: {
                    providerId,
                    ...(filters?.upcomingOnly
                        ? {
                            startsAt: { gte: new Date() },
                        }
                        : {}),
                },
                ...(filters?.status ? { status: filters.status } : {}),
            },
            include: {
                user: true,
                slot: {
                    include: {
                        service: true,
                        provider: true,
                    },
                },
                payment: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async findProviderBookingById(providerId: string, bookingId: string) {
        return prisma.booking.findFirst({
            where: {
                id: bookingId,
                slot: {
                    providerId,
                },
            },
            include: {
                user: true,
                slot: {
                    include: {
                        service: true,
                        provider: true,
                    },
                },
                payment: true,
            },
        });
    }

    async findProviderProfileByUserId(providerUserId: string) {
        return prisma.providerProfile.findUnique({
            where: { userId: providerUserId },
        });
    }

    async findExpiredPendingBookings(now: Date) {
        return prisma.booking.findMany({
            where: {
                status: BookingStatus.PENDING_PAYMENT,
                paymentExpiresAt: { lt: now },
            },
            select: {
                id: true,
            },
        });
    }
}

export const bookingsRepository = new BookingsRepository();