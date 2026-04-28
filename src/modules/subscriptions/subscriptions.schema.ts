import { z } from "zod";

export const cancelSubscriptionSchema = z.object({
    immediate: z.boolean().optional(),
});
