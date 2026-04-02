import { z } from "zod";

const optionalDateString = z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().date().optional());

export const analyticsQuerySchema = z.object({
    cityId: z.string().cuid().optional(),
    serviceId: z.string().cuid().optional(),
    categoryId: z.string().cuid().optional(),
    dateFrom: optionalDateString,
    dateTo: optionalDateString,
});

export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;