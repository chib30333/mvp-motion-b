import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.ts';
import { ApiError } from '../errors/ApiError.ts';

export function errorMiddleware(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            message: err.message,
            details: err.details ?? undefined,
        });
        return;
    }

    const message =
        err instanceof Error ? err.message : 'Internal server error';

    res.status(500).json({
        message: 'Internal server error',
        ...(env.NODE_ENV !== 'production' ? { debug: message } : {}),
    });
}