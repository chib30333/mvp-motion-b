import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next(new UnauthorizedError('Missing or invalid authorization header'));
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
        next(new UnauthorizedError('Invalid or expired access token'));
    }
}