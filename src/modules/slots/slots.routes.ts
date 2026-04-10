import { Router } from "express";
import * as slotsController from "./slots.controller.ts";
import { validate } from "../../core/middleware/validate.middleware.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import {
    cancelSlotSchema,
    createSlotSchema,
    providerSlotsQuerySchema,
    publicServiceSlotsSchema,
    serviceSlotParamsSchema,
    updateSlotSchema,
} from "./slots.schema.ts";

const router = Router();

// Provider routes
router.post(
    "/provider/slots",
    requireAuth,
    requireRole("PROVIDER"),
    validate({ body: createSlotSchema }),
    slotsController.createSlot
);

router.patch(
    "/provider/slots/:slotId",
    requireAuth,
    requireRole("PROVIDER"),
    validate({
        params: cancelSlotSchema,
        body: updateSlotSchema,
    }),
    slotsController.updateSlot
);

router.post(
    "/provider/slots/:slotId/cancel",
    requireAuth,
    requireRole("PROVIDER"),
    validate({ params: cancelSlotSchema }),
    slotsController.cancelSlot
);

router.get(
    "/provider/slots",
    requireAuth,
    requireRole("PROVIDER"),
    validate({ query: providerSlotsQuerySchema }),
    slotsController.getProviderSlots
);

// Public/customer route
router.get(
    "/services/:serviceId/slots",
    validate({
        params: serviceSlotParamsSchema,
        query: publicServiceSlotsSchema,
    }),
    slotsController.getPublicServiceSlots
);

export default router;
