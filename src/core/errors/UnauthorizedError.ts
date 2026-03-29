import { ApiError } from './ApiError.ts';

export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized', details?: unknown) {
        super(401, message, details);
    }
}