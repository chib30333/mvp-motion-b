export class ValidationError extends Error {
    public readonly statusCode: number;
    public readonly details?: unknown;

    constructor(message = "Validation failed", details?: unknown) {
        super(message);
        this.name = "ValidationError";
        this.statusCode = 422;
        this.details = details;
    }
}