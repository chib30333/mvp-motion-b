import { Router } from "express";
import { analyticsController } from "./analytics.controller.ts";
import { analyticsQuerySchema } from "./analytics.schema.ts";
import { validate } from "../../core/middleware/validate.middleware.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";

const router = Router();

router.use(requireAuth);
router.use(requireRole("MANAGER", "ADMIN"));

router.get(
    "/overview",
    validate({ query: analyticsQuerySchema }),
    analyticsController.getOverview
);

router.get(
    "/export/bookings.csv",
    validate({ query: analyticsQuerySchema }),
    analyticsController.exportBookingsCsv
);

export default router;

export const providerAnalyticsRoutes = (() => {
    const r = Router();
    r.use(requireAuth);
    r.use(requireRole("PROVIDER"));
    r.get(
        "/overview",
        validate({ query: analyticsQuerySchema }),
        analyticsController.getProviderOverview
    );
    return r;
})();
