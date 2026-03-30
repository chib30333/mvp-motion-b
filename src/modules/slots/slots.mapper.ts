import type { PublicSlotDto, ProviderSlotDto } from "./slots.types.ts";

export function toProviderSlotDto(slot: any): ProviderSlotDto {
    return {
        id: slot.id,
        serviceId: slot.serviceId,
        serviceTitle: slot.service?.title ?? "",
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        status: slot.status,
        emotionTag: slot.emotionTag,
        capacity: slot.capacity,
        bookedCount: slot.bookedCount,
        availableCount: slot.availableCount,
        priceAmount: slot.priceAmount,
        currency: slot.currency,
        notes: slot.notes ?? null,
    };
}

export function toPublicSlotDto(slot: any): PublicSlotDto {
    return {
        id: slot.id,
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        emotionTag: slot.emotionTag,
        availableCount: slot.availableCount,
        priceAmount: slot.priceAmount,
        currency: slot.currency,
        notes: slot.notes ?? null,
    };
}