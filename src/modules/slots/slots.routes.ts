import { Router } from "express";
import * as slotsController from "./slots.controller.ts";
import { validateBody } from "../../core/middleware/validate.middleware.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import {
    cancelSlotSchema,
    createSlotSchema,
    providerSlotsQuerySchema,
    publicServiceSlotsSchema,
    updateSlotSchema,
} from "./slots.schema.ts";

const router = Router();

// Provider routes
router.post(
    "/provider/slots",
    requireAuth,
    requireRole("PROVIDER"),
    validateBody(createSlotSchema),
    slotsController.createSlot
);

router.patch(
    "/provider/slots/:slotId",
    requireAuth,
    requireRole("PROVIDER"),
    validateBody(updateSlotSchema),
    slotsController.updateSlot
);

router.post(
    "/provider/slots/:slotId/cancel",
    requireAuth,
    requireRole("PROVIDER"),
    validateBody(cancelSlotSchema),
    slotsController.cancelSlot
);

router.get(
    "/provider/slots",
    requireAuth,
    requireRole("PROVIDER"),
    validateBody(providerSlotsQuerySchema),
    slotsController.getProviderSlots
);

// Public/customer route
router.get(
    "/services/:serviceId/slots",
    validateBody(publicServiceSlotsSchema),
    slotsController.getPublicServiceSlots
);

export default router;