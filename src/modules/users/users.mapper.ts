import type { User } from "@prisma/client";

export type SafeUserDto = {
    id: string;
    email: string;
    role: User["role"];
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    emailVerifiedAt: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
};

export const mapSafeUser = (user: User): SafeUserDto => ({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
});
