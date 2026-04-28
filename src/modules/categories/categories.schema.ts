import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
});

export const categoryParamsSchema = z.object({
    id: z.string().min(1),
});

export const listCategoriesQuerySchema = z.object({
    isActive: z.enum(["true", "false"]).optional(),
});
