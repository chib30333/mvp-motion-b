import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';

export function requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(new UnauthorizedError('Unauthorized'));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            next(new ForbiddenError('Insufficient permissions'));
            return;
        }

        next();
    };
}