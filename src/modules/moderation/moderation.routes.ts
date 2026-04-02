import { Router } from "express";
import moderationController from "./moderation.controller.ts";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";

const router = Router();

/**
 * Provider self routes
 */
router.post(
    "/providers/me/application/submit",
    requireAuth,
    requireRole(UserRole.PROVIDER),
    moderationController.submitMyApplication
);

router.get(
    "/providers/me/application-status",
    requireAuth,
    requireRole(UserRole.PROVIDER),
    moderationController.getMyApplicationStatus
);

/**
 * Admin / Manager moderation routes
 */
router.get(
    "/admin/providers",
    requireAuth,
    requireRole(UserRole.MANAGER, UserRole.ADMIN),
    moderationController.listProviders
);

router.get(
    "/admin/providers/:providerId",
    requireAuth,
    requireRole(UserRole.MANAGER, UserRole.ADMIN),
    moderationController.getProviderDetail
);

router.post(
    "/admin/providers/:providerId/approve",
    requireAuth,
    requireRole(UserRole.MANAGER, UserRole.ADMIN),
    moderationController.approveProvider
);

router.post(
    "/admin/providers/:providerId/reject",
    requireAuth,
    requireRole(UserRole.MANAGER, UserRole.ADMIN),
    moderationController.rejectProvider
);

export default router;