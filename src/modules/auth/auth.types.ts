import { AuthProvider, UserRole } from '@prisma/client';

export type SafeUser = {
    id: string;
    email: string;
    role: UserRole;
    authProvider: AuthProvider;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    emailVerifiedAt: Date | null;
    createdAt: Date;
};

export type AuthResponse = {
    user: SafeUser;
    accessToken: string;
};

export type RegisterInput = {
    email: string;
    password: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
};

export type LoginInput = {
    email: string;
    password: string;
};

export type GoogleLoginInput = {
    idToken: string;
    role?: UserRole;
};