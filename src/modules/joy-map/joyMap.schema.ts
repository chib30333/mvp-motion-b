import { z } from "zod";

export const generateJoyMapRequestSchema = z.object({
    forceRegenerate: z.boolean().optional().default(false),
});

export const emotionTagSchema = z.enum([
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
]);

export const joyMapAiItemSchema = z.object({
    dayOfWeek: z.number().int().min(1).max(7),
    emotionTag: emotionTagSchema,
    categorySlug: z.string().min(1).max(50).nullable().optional(),
    title: z.string().min(3).max(120),
    reason: z.string().min(8).max(300),
});

export const joyMapAiResponseSchema = z.object({
    summary: z.string().min(10).max(300),
    items: z.array(joyMapAiItemSchema).min(3).max(5),
});