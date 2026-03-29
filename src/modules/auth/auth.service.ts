import { AuthProvider, UserRole } from '@prisma/client';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import ms from 'ms';
import crypto from 'crypto';
import { env } from '../../config/env.ts';
import { ConflictError } from '../../core/errors/ConflictError.ts';
import { NotFoundError } from '../../core/errors/NotFoundError.ts';
import { UnauthorizedError } from '../../core/errors/UnauthorizedError.ts';
import { compareValue, hashValue } from '../../core/lib/bcrypt.ts';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../../core/lib/jwt.ts';
import { AuthRepository } from './auth.repository.ts';
import type {
    AuthResponse,
    GoogleLoginInput,
    LoginInput,
    RegisterInput,
    SafeUser,
} from './auth.types.ts';

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function buildFullName(firstName?: string, lastName?: string): string | undefined {
    const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
    if (!parts.length) return undefined;
    return parts.join(' ');
}

function sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function parseExpiryToDate(expiresIn: string): Date {
    const milliseconds = ms(expiresIn as ms.StringValue);
    return new Date(Date.now() + milliseconds);
}

export class AuthService {
    private readonly authRepository = new AuthRepository();
    private readonly googleClient = env.GOOGLE_CLIENT_ID
        ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
        : null;

    private mapSafeUser(user: {
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
    }): SafeUser {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            emailVerifiedAt: user.emailVerifiedAt,
            createdAt: user.createdAt,
        };
    }

    private async buildAuthResponse(userId: string): Promise<AuthResponse> {
        const user = await this.authRepository.findUserById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const accessToken = signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            user: this.mapSafeUser(user),
            accessToken,
        };
    }

    private async createAndStoreRefreshToken(userId: string): Promise<string> {
        const rawRefreshToken = signRefreshToken(userId);
        const tokenHash = sha256(rawRefreshToken);

        await this.authRepository.createRefreshToken({
            userId,
            tokenHash,
            expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
        });

        return rawRefreshToken;
    }

    async register(input: RegisterInput): Promise<AuthResponse & { refreshToken: string }> {
        const email = normalizeEmail(input.email);

        const existingUser = await this.authRepository.findUserByEmail(email);
        if (existingUser) {
            throw new ConflictError('Email already in use');
        }

        if (!([UserRole.CUSTOMER, UserRole.PROVIDER] as UserRole[]).includes(input.role)) {
            throw new UnauthorizedError(
                'Public registration is allowed only for CUSTOMER or PROVIDER'
            );
        }

        const passwordHash = await hashValue(input.password);
        const fullName = buildFullName(input.firstName, input.lastName);

        const user = await this.authRepository.createLocalUser({
            email,
            passwordHash,
            role: input.role,
            firstName: input.firstName,
            lastName: input.lastName,
            fullName,
        });

        await this.authRepository.updateUserAfterLogin(user.id);

        const refreshToken = await this.createAndStoreRefreshToken(user.id);
        const authResponse = await this.buildAuthResponse(user.id);

        return {
            ...authResponse,
            refreshToken,
        };
    }

    async login(input: LoginInput): Promise<AuthResponse & { refreshToken: string }> {
        const email = normalizeEmail(input.email);

        const user = await this.authRepository.findUserByEmail(email);
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (!user.passwordHash) {
            throw new UnauthorizedError('This account does not support password login');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('This account is inactive');
        }

        const isPasswordValid = await compareValue(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        await this.authRepository.updateUserAfterLogin(user.id);

        const refreshToken = await this.createAndStoreRefreshToken(user.id);
        const authResponse = await this.buildAuthResponse(user.id);

        return {
            ...authResponse,
            refreshToken,
        };
    }

    private async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
        if (!this.googleClient) {
            throw new UnauthorizedError('Google auth is not configured');
        }

        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            throw new UnauthorizedError('Invalid Google token payload');
        }

        if (!payload.email) {
            throw new UnauthorizedError('Google account email is missing');
        }

        if (!payload.sub) {
            throw new UnauthorizedError('Google account ID is missing');
        }

        return payload;
    }

    async loginWithGoogle(
        input: GoogleLoginInput
    ): Promise<AuthResponse & { refreshToken: string }> {
        const payload = await this.verifyGoogleIdToken(input.idToken);

        const googleId = payload.sub;
        const email = normalizeEmail(payload.email!);

        let user = await this.authRepository.findUserByGoogleId(googleId);

        if (!user) {
            const existingByEmail = await this.authRepository.findUserByEmail(email);

            if (existingByEmail) {
                user = await this.authRepository.linkGoogleAccount({
                    userId: existingByEmail.id,
                    googleId,
                    avatarUrl: payload.picture,
                    firstName: payload.given_name,
                    lastName: payload.family_name,
                    fullName: payload.name,
                    emailVerifiedAt: payload.email_verified ? new Date() : undefined,
                });
            } else {
                const role = input.role ?? UserRole.CUSTOMER;

                if (!([UserRole.CUSTOMER, UserRole.PROVIDER] as UserRole[]).includes(role)) {
                    throw new UnauthorizedError(
                        'Google signup is allowed only for CUSTOMER or PROVIDER'
                    );
                }

                user = await this.authRepository.createGoogleUser({
                    email,
                    googleId,
                    role,
                    firstName: payload.given_name,
                    lastName: payload.family_name,
                    fullName: payload.name,
                    avatarUrl: payload.picture,
                    emailVerifiedAt: payload.email_verified ? new Date() : undefined,
                });
            }
        }

        if (!user.isActive) {
            throw new UnauthorizedError('This account is inactive');
        }

        await this.authRepository.updateUserAfterLogin(user.id);

        const refreshToken = await this.createAndStoreRefreshToken(user.id);
        const authResponse = await this.buildAuthResponse(user.id);

        return {
            ...authResponse,
            refreshToken,
        };
    }

    async refreshSession(
        rawRefreshToken: string
    ): Promise<AuthResponse & { refreshToken: string }> {
        if (!rawRefreshToken) {
            throw new UnauthorizedError('Refresh token is required');
        }

        const payload = verifyRefreshToken(rawRefreshToken);

        if (payload.type !== 'refresh') {
            throw new UnauthorizedError('Invalid refresh token type');
        }

        const tokenHash = sha256(rawRefreshToken);
        const storedToken = await this.authRepository.findRefreshTokenByHash(tokenHash);

        if (!storedToken) {
            throw new UnauthorizedError('Refresh token not found or revoked');
        }

        if (storedToken.expiresAt < new Date()) {
            throw new UnauthorizedError('Refresh token expired');
        }

        const user = await this.authRepository.findUserById(payload.sub);
        if (!user || !user.isActive) {
            throw new UnauthorizedError('User not found or inactive');
        }

        await this.authRepository.revokeRefreshTokenByHash(tokenHash);

        const newRefreshToken = await this.createAndStoreRefreshToken(user.id);
        const authResponse = await this.buildAuthResponse(user.id);

        return {
            ...authResponse,
            refreshToken: newRefreshToken,
        };
    }

    async logout(rawRefreshToken?: string): Promise<void> {
        if (!rawRefreshToken) return;

        try {
            verifyRefreshToken(rawRefreshToken);
            const tokenHash = sha256(rawRefreshToken);
            await this.authRepository.revokeRefreshTokenByHash(tokenHash);
        } catch {
            return;
        }
    }

    async getMe(userId: string): Promise<SafeUser> {
        const user = await this.authRepository.findUserById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('User inactive');
        }

        return this.mapSafeUser(user);
    }
}