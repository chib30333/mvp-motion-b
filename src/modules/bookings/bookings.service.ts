import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { ConflictError, NotFoundError } from "../../core/errors/index.ts";
import { bookingsRepository } from "./bookings.repository.ts";
import type { BookingListQuery, CreateBookingInput } from "./bookings.types.ts";
import { bookingCancellationService } from "./bookingCancellation.service.ts";

export class BookingsService {
    async createBooking(userId: string, input: CreateBookingInput) {
        const now = new Date();
        const paymentExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const slot = await bookingsRepository.findSlotForBooking(tx, input.slotId);

            if (!slot) {
                throw new NotFoundError("Slot not found");
            }

            if (slot.status !== "ACTIVE") {
                throw new ConflictError("Slot is not active");
            }

            if (slot.startsAt <= now) {
                throw new ConflictError("Cannot book a slot that has already started");
            }

            if (slot.availableCount <= 0) {
                throw new ConflictError("Slot is no longer available");
            }

            if (slot.service.status !== "ACTIVE") {
                throw new ConflictError("Service is not active");
            }

            if (slot.provider.approvalStatus !== "APPROVED") {
                throw new ConflictError("Provider is not approved");
            }

            const existingActiveBooking = await bookingsRepository.findActiveBookingForUserAndSlot(
                tx,
                userId,
                input.slotId
            );

            if (existingActiveBooking) {
                throw new ConflictError("You already have an active booking for this slot");
            }

            const updatedSlot = await bookingsRepository.reserveSlotInventory(tx, slot.id);

            if (updatedSlot.count === 0) {
                throw new ConflictError("Slot is no longer available");
            }

            const booking = await bookingsRepository.createPendingBooking(tx, {
                userId,
                slotId: slot.id,
                totalAmount: slot.priceAmount,
                currency: slot.currency,
                notes: input.notes,
                paymentExpiresAt,
            });

            return booking;
        });
    }

    async getMyBookings(userId: string, query: BookingListQuery) {
        return bookingsRepository.findCustomerBookings(userId, {
            status: query.status as BookingStatus | undefined,
            upcomingOnly: query.upcomingOnly,
        });
    }

    async getMyBookingById(userId: string, bookingId: string) {
        const booking = await bookingsRepository.findCustomerBookingById(userId, bookingId);

        if (!booking) {
            throw new NotFoundError("Booking not found");
        }

        return booking;
    }

    async cancelBooking(userId: string, bookingId: string, reason?: string) {
        return bookingCancellationService.cancelBooking(userId, bookingId, reason);
    }

    async getProviderBookings(providerUserId: string, query: BookingListQuery) {
        const provider = await bookingsRepository.findProviderProfileByUserId(providerUserId);

        if (!provider) {
            throw new NotFoundError("Provider profile not found");
        }

        return bookingsRepository.findProviderBookings(provider.id, {
            status: query.status as BookingStatus | undefined,
            upcomingOnly: query.upcomingOnly,
        });
    }

    async getProviderBookingById(providerUserId: string, bookingId: string) {
        const provider = await bookingsRepository.findProviderProfileByUserId(providerUserId);

        if (!provider) {
            throw new NotFoundError("Provider profile not found");
        }

        const booking = await bookingsRepository.findProviderBookingById(provider.id, bookingId);

        if (!booking) {
            throw new NotFoundError("Booking not found");
        }

        return booking;
    }

    async expireUnpaidBookings() {
        const now = new Date();
        const expired = await bookingsRepository.findExpiredPendingBookings(now);

        let expiredCount = 0;

        for (const item of expired) {
            const result = await bookingCancellationService.expireSingleBooking(item.id);
            if (result) {
                expiredCount += 1;
            }
        }

        return { expiredCount };
    }
}

export const bookingsService = new BookingsService();