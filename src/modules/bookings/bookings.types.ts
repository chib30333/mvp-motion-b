export type CreateBookingInput = {
    slotId: string;
    notes?: string;
};

export type CancelBookingInput = {
    reason?: string;
};

export type BookingListQuery = {
    status?: string;
    upcomingOnly?: boolean;
};

export type BookingResponseDto = {
    id: string;
    status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
    totalAmount: number;
    currency: string;
    notes?: string | null;
    cancellationReason?: string | null;
    cancelledAt?: string | null;
    refundAmount?: number | null;
    paymentExpiresAt?: string | null;
    createdAt: string;
    slot: {
        id: string;
        startsAt: string;
        endsAt: string;
        emotionTag: string;
        priceAmount: number;
        currency: string;
        service: {
            id: string;
            title: string;
            coverImageUrl?: string | null;
        };
        provider: {
            id: string;
            brandName: string;
        };
    };
};

export type CancelBookingResult = {
    booking: any;
    refundEligible: boolean;
};