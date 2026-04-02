import { Router } from "express";
import { analyticsController } from "./analytics.controller.ts";
import { analyticsQuerySchema } from "./analytics.schema.ts";
import { validateBody } from "../../core/middleware/validate.middleware.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";

const router = Router();

router.use(requireAuth);
router.use(requireRole("MANAGER", "ADMIN"));

router.get(
    "/overview",
    validateBody(analyticsQuerySchema),
    analyticsController.getOverview
);

router.get(
    "/export/bookings.csv",
    validateBody(analyticsQuerySchema),
    analyticsController.exportBookingsCsv
);

export default router;