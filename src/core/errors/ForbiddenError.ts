import { ApiError } from './ApiError.ts';

export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden', details?: unknown) {
        super(403, message, details);
    }
}