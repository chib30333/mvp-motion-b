import { z } from "zod";

export const createReviewSchema = z.object({
    bookingId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
});

export const reviewParamsSchema = z.object({
    id: z.string().min(1),
});

export const listProviderReviewsQuerySchema = z.object({
    providerId: z.string().min(1),
    page: z.coerce.number().int().min(1).default(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
});
