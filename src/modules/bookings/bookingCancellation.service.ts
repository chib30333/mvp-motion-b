import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { ConflictError, NotFoundError } from "../../core/errors/index.ts";
import { bookingsRepository } from "./bookings.repository.ts";
import type { CancelBookingResult } from "./bookings.types.ts";

export function isFullRefundEligible(slotStartsAt: Date, now = new Date()) {
    return slotStartsAt.getTime() - now.getTime() >= 12 * 60 * 60 * 1000;
}

export class BookingCancellationService {
    async cancelBooking(
        userId: string,
        bookingId: string,
        reason?: string
    ): Promise<CancelBookingResult> {
        const now = new Date();

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const booking = await bookingsRepository.findBookingByIdForUser(tx, bookingId, userId);

            if (!booking) {
                throw new NotFoundError("Booking not found");
            }

            if (!([BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED] as BookingStatus[]).includes(booking.status)) {
                throw new ConflictError("This booking cannot be cancelled");
            }

            const refundEligible =
                booking.status === BookingStatus.CONFIRMED
                    ? isFullRefundEligible(booking.slot.startsAt, now)
                    : false;

            const refundAmount =
                booking.status === BookingStatus.CONFIRMED && refundEligible
                    ? booking.totalAmount
                    : 0;

            const updatedBooking = await bookingsRepository.updateBookingCancelled(tx, booking.id, {
                cancelledAt: now,
                cancellationReason: reason,
                refundAmount,
            });

            await bookingsRepository.releaseSlotInventory(tx, booking.slotId);

            return {
                booking: updatedBooking,
                refundEligible,
            };
        });
    }

    async expireSingleBooking(bookingId: string) {
        const now = new Date();

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: {
                    slot: true,
                },
            });

            if (!booking) {
                return null;
            }

            if (booking.status !== BookingStatus.PENDING_PAYMENT) {
                return null;
            }

            if (!booking.paymentExpiresAt || booking.paymentExpiresAt >= now) {
                return null;
            }

            await tx.booking.update({
                where: { id: booking.id },
                data: {
                    status: BookingStatus.CANCELLED,
                    cancelledAt: now,
                    cancellationReason: "Payment session expired",
                    refundAmount: 0,
                },
            });

            await bookingsRepository.releaseSlotInventory(tx, booking.slotId);

            return booking.id;
        });
    }
}

export const bookingCancellationService = new BookingCancellationService();