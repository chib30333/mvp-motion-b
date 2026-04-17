import { AuthProvider, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../../core/db/prisma.ts';
import type { RefreshToken, User } from '@prisma/client';

type PasswordResetTokenRecord = {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
};

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

    async createPasswordResetToken(data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<PasswordResetTokenRecord> {
        const id = crypto.randomUUID();
        const [record] = await prisma.$queryRaw<PasswordResetTokenRecord[]>(Prisma.sql`
            INSERT INTO "PasswordResetToken" ("id", "userId", "tokenHash", "expiresAt", "createdAt")
            VALUES (${id}, ${data.userId}, ${data.tokenHash}, ${data.expiresAt}, NOW())
            RETURNING "id", "userId", "tokenHash", "expiresAt", "usedAt", "createdAt"
        `);

        if (!record) {
            throw new Error('Failed to create password reset token');
        }

        return record;
    }

    async invalidatePasswordResetTokensForUser(userId: string): Promise<void> {
        await prisma.$executeRaw(
            Prisma.sql`
                UPDATE "PasswordResetToken"
                SET "usedAt" = NOW()
                WHERE "userId" = ${userId} AND "usedAt" IS NULL
            `
        );
    }

    async findActivePasswordResetTokenByHash(
        tokenHash: string
    ): Promise<PasswordResetTokenRecord | null> {
        const [record] = await prisma.$queryRaw<PasswordResetTokenRecord[]>(Prisma.sql`
            SELECT "id", "userId", "tokenHash", "expiresAt", "usedAt", "createdAt"
            FROM "PasswordResetToken"
            WHERE "tokenHash" = ${tokenHash}
              AND "usedAt" IS NULL
              AND "expiresAt" > NOW()
            LIMIT 1
        `);

        return record ?? null;
    }

    async markPasswordResetTokenUsed(id: string): Promise<void> {
        await prisma.$executeRaw(
            Prisma.sql`
                UPDATE "PasswordResetToken"
                SET "usedAt" = NOW()
                WHERE "id" = ${id}
            `
        );
    }

    async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                authProvider: AuthProvider.LOCAL,
            },
        });
    }
}
