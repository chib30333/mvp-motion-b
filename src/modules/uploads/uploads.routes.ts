import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { validate } from "../../core/middleware/validate.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";
import { uploadsController } from "./uploads.controller.ts";
import { registerUploadSchema } from "./uploads.schema.ts";

const router = Router();

router.use(requireAuth);

router.post(
    "/provider-documents",
    requireRole(UserRole.PROVIDER),
    validate({ body: registerUploadSchema }),
    asyncHandler(uploadsController.registerProviderDocument)
);

router.get(
    "/provider-documents/me",
    requireRole(UserRole.PROVIDER),
    asyncHandler(uploadsController.listMyProviderDocuments)
);

export default router;
