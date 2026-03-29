import { ApiError } from './ApiError.ts';

export class BadRequestError extends ApiError {
    constructor(message = 'Bad request', details?: unknown) {
        super(400, message, details);
    }
}