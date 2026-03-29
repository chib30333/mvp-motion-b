import { ApiError } from './ApiError.ts';

export class NotFoundError extends ApiError {
    constructor(message = 'Not found', details?: unknown) {
        super(404, message, details);
    }
}