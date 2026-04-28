import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { validate } from "../../core/middleware/validate.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";
import { usersController } from "./users.controller.ts";
import {
    listUsersQuerySchema,
    userParamsSchema,
    updateUserStatusSchema,
    updateUserRoleSchema,
} from "./users.schema.ts";

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.MANAGER, UserRole.ADMIN));

router.get(
    "/",
    validate({ query: listUsersQuerySchema }),
    asyncHandler(usersController.list)
);

router.get(
    "/:id",
    validate({ params: userParamsSchema }),
    asyncHandler(usersController.getById)
);

router.patch(
    "/:id/status",
    validate({ params: userParamsSchema, body: updateUserStatusSchema }),
    asyncHandler(usersController.setStatus)
);

router.patch(
    "/:id/role",
    validate({ params: userParamsSchema, body: updateUserRoleSchema }),
    asyncHandler(usersController.setRole)
);

export default router;
