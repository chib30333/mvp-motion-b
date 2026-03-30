import { z } from "zod";

const emotionTags = [
    "CALM",
    "JOY",
    "ENERGY",
    "RECOVERY",
    "FOCUS",
    "BALANCE",
    "CONFIDENCE",
    "RELAX",
    "SOCIAL",
    "MINDFULNESS",
] as const;

export const createSlotSchema = z.object({
    body: z.object({
        serviceId: z.string().min(1),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        capacity: z.number().int().min(1).max(100),
        priceAmount: z.number().int().min(1),
        emotionTag: z.enum(emotionTags).optional(),
        notes: z.string().trim().max(500).optional(),
    }),
});

export const updateSlotSchema = z.object({
    params: z.object({
        slotId: z.string().min(1),
    }),
    body: z.object({
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional(),
        capacity: z.number().int().min(1).max(100).optional(),
        priceAmount: z.number().int().min(1).optional(),
        emotionTag: z.enum(emotionTags).optional(),
        notes: z.string().trim().max(500).nullable().optional(),
    }),
});

export const cancelSlotSchema = z.object({
    params: z.object({
        slotId: z.string().min(1),
    }),
});

export const providerSlotsQuerySchema = z.object({
    query: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        serviceId: z.string().optional(),
        status: z.enum(["ACTIVE", "CANCELLED", "COMPLETED"]).optional(),
    }),
});

export const publicServiceSlotsSchema = z.object({
    params: z.object({
        serviceId: z.string().min(1),
    }),
    query: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
    }),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>["body"];
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>["body"];