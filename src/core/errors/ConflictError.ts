import { ApiError } from './ApiError.ts';

export class ConflictError extends ApiError {
    constructor(message = 'Conflict', details?: unknown) {
        super(409, message, details);
    }
}