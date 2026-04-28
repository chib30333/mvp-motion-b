import { z } from "zod";

export const registerUploadSchema = z.object({
    fileUrl: z.string().url(),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().max(120).optional(),
});
