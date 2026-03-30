export type ProviderSlotDto = {
    id: string;
    serviceId: string;
    serviceTitle: string;
    startsAt: string;
    endsAt: string;
    status: string;
    emotionTag: string;
    capacity: number;
    bookedCount: number;
    availableCount: number;
    priceAmount: number;
    currency: string;
    notes: string | null;
};

export type PublicSlotDto = {
    id: string;
    startsAt: string;
    endsAt: string;
    emotionTag: string;
    availableCount: number;
    priceAmount: number;
    currency: string;
    notes: string | null;
};

export type ProviderSlotsQuery = {
    from?: string;
    to?: string;
    serviceId?: string;
    status?: string;
};

export type PublicServiceSlotsQuery = {
    from?: string;
    to?: string;
};