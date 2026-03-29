import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt.ts';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            message: 'Unauthorized: missing or invalid authorization header',
        });
        return;
    }

    const token = authHeader.substring('Bearer '.length).trim();

    try {
        const payload = verifyAccessToken(token);

        req.user = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role as UserRole,
        };

        next();
    } catch {
        res.status(401).json({
            message: 'Unauthorized: invalid or expired access token',
        });
    }
}