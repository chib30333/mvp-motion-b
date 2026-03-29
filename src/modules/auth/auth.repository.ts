import { AuthProvider, Prisma } from '@prisma/client';
import { prisma } from '../../core/db/prisma.ts';
import type { RefreshToken, User } from '@prisma/client';

export class AuthRepository {
    async findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async findUserByGoogleId(googleId: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { googleId },
        });
    }

    async findUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    async createLocalUser(data: {
        email: string;
        passwordHash: string;
        role: Prisma.UserCreateInput['role'];
        firstName?: string;
        lastName?: string;
        fullName?: string;
    }): Promise<User> {
        return prisma.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                role: data.role,
                authProvider: AuthProvider.LOCAL,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: data.fullName,
            },
        });
    }

    async createGoogleUser(data: {
        email: string;
        googleId: string;
        role: Prisma.UserCreateInput['role'];
        firstName?: string;
        lastName?: string;
        fullName?: string;
        avatarUrl?: string;
        emailVerifiedAt?: Date;
    }): Promise<User> {
        return prisma.user.create({
            data: {
                email: data.email,
                googleId: data.googleId,
                role: data.role,
                authProvider: AuthProvider.GOOGLE,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: data.fullName,
                avatarUrl: data.avatarUrl,
                emailVerifiedAt: data.emailVerifiedAt,
            },
        });
    }

    async updateUserAfterLogin(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                lastLoginAt: new Date(),
            },
        });
    }

    async linkGoogleAccount(params: {
        userId: string;
        googleId: string;
        avatarUrl?: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        emailVerifiedAt?: Date;
    }): Promise<User> {
        return prisma.user.update({
            where: { id: params.userId },
            data: {
                googleId: params.googleId,
                authProvider: AuthProvider.GOOGLE,
                avatarUrl: params.avatarUrl,
                firstName: params.firstName,
                lastName: params.lastName,
                fullName: params.fullName,
                emailVerifiedAt: params.emailVerifiedAt,
            },
        });
    }

    async createRefreshToken(data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<RefreshToken> {
        return prisma.refreshToken.create({
            data,
        });
    }

    async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
        return prisma.refreshToken.findFirst({
            where: {
                tokenHash,
                revokedAt: null,
            },
        });
    }

    async revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: {
                tokenHash,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    async revokeAllUserRefreshTokens(userId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }
}