import { Router } from "express";
import { customerProfileController } from "./customerProfile.controller.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { validateBody } from "../../core/middleware/validate.middleware.ts";
import {
    onboardingCustomerSchema,
    updateCustomerProfileSchema,
} from "./customerProfile.schema.ts";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(requireAuth);
router.use(requireRole(UserRole.CUSTOMER));

router.get("/me", customerProfileController.getMe);
router.patch(
    "/me",
    validateBody(updateCustomerProfileSchema),
    customerProfileController.updateMe
);
router.post(
    "/onboarding",
    validateBody(onboardingCustomerSchema),
    customerProfileController.submitOnboarding
);

export default router;