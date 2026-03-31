import { z } from "zod";

export const createBookingSchema = z.object({
    slotId: z.string().cuid(),
    notes: z.string().trim().max(500).optional(),
});

export const cancelBookingSchema = z.object({
    reason: z.string().trim().max(500).optional(),
});

export const bookingIdParamSchema = z.object({
    id: z.string().cuid(),
});

export const bookingIdRouteParamSchema = z.object({
  bookingId: z.string().cuid(),
});

export const bookingListQuerySchema = z.object({
    status: z
        .enum(["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
        .optional(),
    upcomingOnly: z
        .union([z.literal("true"), z.literal("false")])
        .optional()
        .transform((v) => v === "true"),
});