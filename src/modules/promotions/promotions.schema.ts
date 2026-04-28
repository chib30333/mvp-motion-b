import { z } from "zod";
import { CampaignAudience } from "@prisma/client";

export const createPromotionSchema = z.object({
    title: z.string().trim().min(2).max(160),
    content: z.string().trim().min(1).max(4000),
    audience: z.nativeEnum(CampaignAudience),
    isActive: z.boolean().optional(),
    scheduledAt: z.string().datetime().optional(),
});

export const updatePromotionSchema = z.object({
    title: z.string().trim().min(2).max(160).optional(),
    content: z.string().trim().min(1).max(4000).optional(),
    audience: z.nativeEnum(CampaignAudience).optional(),
    isActive: z.boolean().optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
});

export const promotionParamsSchema = z.object({
    id: z.string().min(1),
});
