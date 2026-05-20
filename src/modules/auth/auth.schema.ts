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
    password: z.string().min(8).max(100),
});

export const googleLoginSchema = z.object({
    idToken: z.string().min(1),
    role: z.enum(publicRoles).optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email().trim().toLowerCase(),
});

export const resetPasswordSchema = z
    .object({
        token: z.string().min(1),
        password: z.string().min(8).max(100),
        confirmPassword: z.string().min(8).max(100),
    })
    .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

export const updateMeSchema = z.object({
    firstName: z.string().trim().min(1).max(100).nullable().optional(),
    lastName: z.string().trim().min(1).max(100).nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(8).max(100),
        newPassword: z.string().min(8).max(100),
        confirmPassword: z.string().min(8).max(100),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

export type UpdateMeSchemaInput = z.infer<typeof updateMeSchema>;
export type ChangePasswordSchemaInput = z.infer<typeof changePasswordSchema>;
export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type LoginSchemaInput = z.infer<typeof loginSchema>;
export type GoogleLoginSchemaInput = z.infer<typeof googleLoginSchema>;
export type ForgotPasswordSchemaInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchemaInput = z.infer<typeof resetPasswordSchema>;
