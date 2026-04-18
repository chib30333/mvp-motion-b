import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";
import { dashboardsController } from "./dashboards.controller.ts";

const router = Router();

router.get(
  "/customer/account",
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(dashboardsController.getCustomerAccount)
);

router.get(
  "/provider/panel",
  requireAuth,
  requireRole(UserRole.PROVIDER),
  asyncHandler(dashboardsController.getProviderPanel)
);

router.get(
  "/admin/panel",
  requireAuth,
  requireRole(UserRole.MANAGER, UserRole.ADMIN),
  asyncHandler(dashboardsController.getAdminPanel)
);

export default router;
