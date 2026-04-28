import { z } from "zod";

export const createCitySchema = z.object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
    countryCode: z.string().trim().length(2).default("RU"),
    isActive: z.boolean().optional(),
});

export const updateCitySchema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    countryCode: z.string().trim().length(2).optional(),
    isActive: z.boolean().optional(),
});

export const cityParamsSchema = z.object({
    id: z.string().min(1),
});

export const listCitiesQuerySchema = z.object({
    isActive: z.enum(["true", "false"]).optional(),
});
