import type { NextFunction, Request, Response } from 'express';
import { type ZodType, ZodObject, ZodError } from 'zod';
import { BadRequestError } from '../errors/BadRequestError.ts';

type RequestParts = {
    body?: ZodType<any, any, any>;
    query?: ZodType<any, any, any>;
    params?: ZodType<any, any, any>;
};

export function validate(schemas: RequestParts) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }

            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }

            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(
                    new BadRequestError('Validation failed', {
                        issues: error.issues,
                    })
                );
                return;
            }

            next(error);
        }
    };
}

export function validateQuery(schema: ZodObject) {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req.query);
            req.query = parsed as any; // safe enough for MVP
            next();
        } catch (error) {
            next(error);
        }
    };
}

export const validateBody = (schema: ZodType<any>) => validate({ body: schema });