import { UserRole } from '@prisma/client';
import { z } from 'zod';

const publicRoles = [UserRole.CUSTOMER, UserRole.PROVIDER] as const;

export const registerSchema = z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(8).max(100),
    role: z.enum(publicRoles),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(1),
});

export const googleLoginSchema = z.object({
    idToken: z.string().min(1),
    role: z.enum(publicRoles).optional(),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type LoginSchemaInput = z.infer<typeof loginSchema>;
export type GoogleLoginSchemaInput = z.infer<typeof googleLoginSchema>;