import type { Request, Response } from 'express';
import { env } from '../../config/env.ts';
import { AuthService } from './auth.service.ts';

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
        const result = await authService.register(req.body);
        setRefreshTokenCookie(res, result.refreshToken);

        res.status(201).json({
            user: result.user,
            accessToken: result.accessToken,
        });
    }

    async login(req: Request, res: Response): Promise<void> {
        const result = await authService.login(req.body);
        setRefreshTokenCookie(res, result.refreshToken);

        res.status(200).json({
            user: result.user,
            accessToken: result.accessToken,
        });
    }

    async google(req: Request, res: Response): Promise<void> {
        const result = await authService.loginWithGoogle(req.body);
        setRefreshTokenCookie(res, result.refreshToken);

        res.status(200).json({
            user: result.user,
            accessToken: result.accessToken,
        });
    }

    async refresh(req: Request, res: Response): Promise<void> {
        const refreshToken = req.cookies?.[env.COOKIE_REFRESH_TOKEN_NAME];
        const result = await authService.refreshSession(refreshToken);

        setRefreshTokenCookie(res, result.refreshToken);

        res.status(200).json({
            user: result.user,
            accessToken: result.accessToken,
        });
    }

    async logout(req: Request, res: Response): Promise<void> {
        const refreshToken = req.cookies?.[env.COOKIE_REFRESH_TOKEN_NAME];
        await authService.logout(refreshToken);

        clearRefreshTokenCookie(res);

        res.status(200).json({
            message: 'Logged out successfully',
        });
    }

    async me(req: Request, res: Response): Promise<void> {
        const user = await authService.getMe(req.user!.userId);

        res.status(200).json({
            user,
        });
    }
}