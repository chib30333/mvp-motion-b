import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';

export function requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.user as { id: string; role: UserRole } | undefined;

        if (!user) {
            const error = new Error("Unauthorized");
            (error as any).statusCode = 401;
            return next(error);
        }

        if (!allowedRoles.includes(user.role)) {
            const error = new Error("Forbidden");
            (error as any).statusCode = 403;
            return next(error);
        }

        next();
    };
}