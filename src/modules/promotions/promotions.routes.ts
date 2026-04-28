import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { validate } from "../../core/middleware/validate.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";
import { promotionsController } from "./promotions.controller.ts";
import {
    createPromotionSchema,
    updatePromotionSchema,
    promotionParamsSchema,
} from "./promotions.schema.ts";

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.MANAGER, UserRole.ADMIN));

router.get("/", asyncHandler(promotionsController.list));

router.get(
    "/:id",
    validate({ params: promotionParamsSchema }),
    asyncHandler(promotionsController.getById)
);

router.post(
    "/",
    validate({ body: createPromotionSchema }),
    asyncHandler(promotionsController.create)
);

router.patch(
    "/:id",
    validate({ params: promotionParamsSchema, body: updatePromotionSchema }),
    asyncHandler(promotionsController.update)
);

router.post(
    "/:id/send",
    validate({ params: promotionParamsSchema }),
    asyncHandler(promotionsController.send)
);

export default router;
