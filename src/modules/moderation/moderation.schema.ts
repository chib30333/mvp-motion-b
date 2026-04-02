import { z } from "zod";

export const rejectProviderSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(3, "Rejection reason must be at least 3 characters")
        .max(500, "Rejection reason is too long"),
});

export const adminListProvidersQuerySchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
    cityId: z.string().cuid().optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type RejectProviderInput = z.infer<typeof rejectProviderSchema>;
export type AdminListProvidersQuery = z.infer<
    typeof adminListProvidersQuerySchema
>;