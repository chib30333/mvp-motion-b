import type { Request, Response } from 'express';
import { env } from '../../config/env.ts';
import { AuthService } from './auth.service.ts';
import {
    googleLoginSchema,
    loginSchema,
    registerSchema,
} from './auth.schema.ts';

const authService = new AuthService();

function setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(env.COOKIE_REFRESH_TOKEN_NAME, refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
}

function clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(env.COOKIE_REFRESH_TOKEN_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    });
}

export class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        try {
            const input = registerSchema.parse(req.body);
            const result = await authService.register(input);

            setRefreshTokenCookie(res, result.refreshToken);

            res.status(201).json({
                user: result.user,
                accessToken: result.accessToken,
            });
        } catch (error: any) {
            const message = error?.message ?? 'Registration failed';

            res.status(message === 'Email already in use' ? 409 : 400).json({
                message,
            });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const input = loginSchema.parse(req.body);
            const result = await authService.login(input);

            setRefreshTokenCookie(res, result.refreshToken);

            res.status(200).json({
                user: result.user,
                accessToken: result.accessToken,
            });
        } catch (error: any) {
            const message = error?.message ?? 'Login failed';

            res.status(401).json({
                message,
            });
        }
    }

    async google(req: Request, res: Response): Promise<void> {
        try {
            const input = googleLoginSchema.parse(req.body);
            const result = await authService.loginWithGoogle(input);

            setRefreshTokenCookie(res, result.refreshToken);

            res.status(200).json({
                user: result.user,
                accessToken: result.accessToken,
            });
        } catch (error: any) {
            res.status(401).json({
                message: error?.message ?? 'Google authentication failed',
            });
        }
    }

    async refresh(req: Request, res: Response): Promise<void> {
        try {
            const refreshToken = req.cookies?.[env.COOKIE_REFRESH_TOKEN_NAME];

            const result = await authService.refreshSession(refreshToken);

            setRefreshTokenCookie(res, result.refreshToken);

            res.status(200).json({
                user: result.user,
                accessToken: result.accessToken,
            });
        } catch (error: any) {
            clearRefreshTokenCookie(res);

            res.status(401).json({
                message: error?.message ?? 'Refresh failed',
            });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            const refreshToken = req.cookies?.[env.COOKIE_REFRESH_TOKEN_NAME];

            await authService.logout(refreshToken);
            clearRefreshTokenCookie(res);

            res.status(200).json({
                message: 'Logged out successfully',
            });
        } catch {
            clearRefreshTokenCookie(res);

            res.status(200).json({
                message: 'Logged out successfully',
            });
        }
    }

    async me(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: 'Unauthorized',
                });
                return;
            }

            const user = await authService.getMe(req.user.userId);

            res.status(200).json({
                user,
            });
        } catch (error: any) {
            res.status(404).json({
                message: error?.message ?? 'Failed to load current user',
            });
        }
    }
}