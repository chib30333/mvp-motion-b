import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { validate } from "../../core/middleware/validate.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";
import { subscriptionsController } from "./subscriptions.controller.ts";
import { cancelSubscriptionSchema } from "./subscriptions.schema.ts";

const router = Router();

router.get("/plans", asyncHandler(subscriptionsController.listPlans));

router.get(
    "/me",
    requireAuth,
    asyncHandler(subscriptionsController.listMine)
);

router.get(
    "/me/active",
    requireAuth,
    asyncHandler(subscriptionsController.getMyActive)
);

router.post(
    "/me/cancel",
    requireAuth,
    validate({ body: cancelSubscriptionSchema }),
    asyncHandler(subscriptionsController.cancelMine)
);

export default router;
