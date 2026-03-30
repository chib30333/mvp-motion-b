import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { validateBody } from "../../core/middleware/validate.middleware.ts";
import { providersController } from "./providers.controller.ts";
import {
    submitProviderProfileSchema,
    updateProviderProfileSchema,
} from "./providers.schema.ts";

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.PROVIDER));

router.get("/me", providersController.getMe);

router.patch(
    "/me",
    validateBody(updateProviderProfileSchema),
    providersController.updateMe
);

router.post(
    "/me/submit",
    validateBody(submitProviderProfileSchema),
    providersController.submitForApproval
);

export default router;