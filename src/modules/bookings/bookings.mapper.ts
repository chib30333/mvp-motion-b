import type { BookingResponseDto } from "./bookings.types.ts";

type BookingWithRelations = any;

export function toBookingResponseDto(booking: BookingWithRelations): BookingResponseDto {
    return {
        id: booking.id,
        status: booking.status,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        notes: booking.notes ?? null,
        cancellationReason: booking.cancellationReason ?? null,
        cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
        refundAmount: booking.refundAmount ?? null,
        paymentExpiresAt: booking.paymentExpiresAt ? booking.paymentExpiresAt.toISOString() : null,
        createdAt: booking.createdAt.toISOString(),
        slot: {
            id: booking.slot.id,
            startsAt: booking.slot.startsAt.toISOString(),
            endsAt: booking.slot.endsAt.toISOString(),
            emotionTag: booking.slot.emotionTag,
            priceAmount: booking.slot.priceAmount,
            currency: booking.slot.currency,
            service: {
                id: booking.slot.service.id,
                title: booking.slot.service.title,
                coverImageUrl: booking.slot.service.coverImageUrl ?? null,
            },
            provider: {
                id: booking.slot.provider.id,
                brandName: booking.slot.provider.brandName,
            },
        },
    };
}