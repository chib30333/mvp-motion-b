import { z } from "zod";

const optionalTrimmedString = (max: number) =>
    z.string().trim().max(max).optional();

const optionalUrlOrEmpty = z
    .string()
    .trim()
    .max(500)
    .refine(
        (value) => value === "" || /^https?:\/\/.+/i.test(value),
        "Must be a valid URL"
    )
    .optional();

export const updateProviderProfileSchema = z.object({
    brandName: z.string().trim().min(2).max(120).optional(),
    bio: optionalTrimmedString(2000),
    cityId: z.string().cuid().optional(),
    addressLine: optionalTrimmedString(255),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    websiteUrl: optionalUrlOrEmpty,
    instagramUrl: optionalUrlOrEmpty,
    includeInJoyMap: z.boolean().optional(),
});

export const submitProviderProfileSchema = z.object({});