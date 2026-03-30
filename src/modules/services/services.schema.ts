import { z } from "zod";

export const serviceStatusEnum = z.enum([
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
    "ARCHIVED",
]);

export const emotionTagEnum = z.enum([
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

export const createServiceSchema = z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(3000).nullable().optional(),
    categoryId: z.string().cuid(),
    cityId: z.string().cuid(),
    emotionTag: emotionTagEnum,
    priceAmount: z.number().int().positive(),
    durationMinutes: z.number().int().min(15).max(480),
    capacityDefault: z.number().int().min(1).max(100),
    coverImageUrl: z.string().url().nullable().optional(),
    isFeatured: z.boolean().optional(),
    status: z.enum(["DRAFT", "ACTIVE"]).optional().default("DRAFT"),
    imageUrls: z.array(z.string().url()).max(10).optional().default([]),
});

export const updateServiceSchema = z.object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(3000).nullable().optional(),
    categoryId: z.string().cuid().optional(),
    cityId: z.string().cuid().optional(),
    emotionTag: emotionTagEnum.optional(),
    priceAmount: z.number().int().positive().optional(),
    durationMinutes: z.number().int().min(15).max(480).optional(),
    capacityDefault: z.number().int().min(1).max(100).optional(),
    coverImageUrl: z.string().url().nullable().optional(),
    isFeatured: z.boolean().optional(),
    imageUrls: z.array(z.string().url()).max(10).optional(),
});

export const updateServiceStatusSchema = z.object({
    status: serviceStatusEnum.refine(
        (value) => ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"].includes(value),
        { message: "Invalid service status" }
    ),
});

export const providerServiceParamsSchema = z.object({
    id: z.string().cuid(),
});

export const publicServiceParamsSchema = z.object({
    slug: z.string().trim().min(1).max(160),
});

export const listProviderServicesQuerySchema = z.object({
    status: serviceStatusEnum.optional(),
    categoryId: z.string().cuid().optional(),
    cityId: z.string().cuid().optional(),
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const listPublicServicesQuerySchema = z.object({
    cityId: z.string().cuid().optional(),
    categoryId: z.string().cuid().optional(),
    emotionTag: emotionTagEnum.optional(),
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sortBy: z.enum(["newest", "priceAsc", "priceDesc"]).optional().default("newest"),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type UpdateServiceStatusInput = z.infer<typeof updateServiceStatusSchema>;
export type ListProviderServicesQuery = z.infer<typeof listProviderServicesQuerySchema>;
export type ListPublicServicesQuery = z.infer<typeof listPublicServicesQuerySchema>;