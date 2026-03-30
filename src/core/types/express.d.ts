import { UserRole } from "@prisma/client";

declare global {
    namespace Express {
        interface UserPayload {
            userId: string;
            role: UserRole;
            email: string;
        }

        interface Request {
            user?: UserPayload;
        }
    }
}

export { };