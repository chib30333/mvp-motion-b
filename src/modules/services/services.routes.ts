import { Router } from "express";
import { ServicesController } from "./services.controller.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { validate } from "../../core/middleware/validate.middleware.ts";
import {
    createServiceSchema,
    updateServiceSchema,
    updateServiceStatusSchema,
    providerServiceParamsSchema,
    publicServiceParamsSchema,
    listProviderServicesQuerySchema,
    listPublicServicesQuerySchema,
} from "./services.schema.ts";

const router = Router();

// Provider routes
router.post(
    "/provider/services",
    requireAuth,
    requireRole("PROVIDER"),
    validate({ body: createServiceSchema }),
    ServicesController.createService
);

router.get(
    "/provider/services",
    requireAuth,
    requireRole("PROVIDER"),
    validate({ query: listProviderServicesQuerySchema }),
    ServicesController.listProviderServices
);

router.get(
    "/provider/services/:id",
    requireAuth,
    requireRole("PROVIDER"),
    validate({ params: providerServiceParamsSchema }),
    ServicesController.getProviderServiceById
);

router.patch(
    "/provider/services/:id",
    requireAuth,
    requireRole("PROVIDER"),
    validate({
        params: providerServiceParamsSchema,
        body: updateServiceSchema,
    }),
    ServicesController.updateService
);

router.patch(
    "/provider/services/:id/status",
    requireAuth,
    requireRole("PROVIDER"),
    validate({
        params: providerServiceParamsSchema,
        body: updateServiceStatusSchema,
    }),
    ServicesController.updateServiceStatus
);

router.delete(
    "/provider/services/:id",
    requireAuth,
    requireRole("PROVIDER"),
    validate({ params: providerServiceParamsSchema }),
    ServicesController.archiveService
);

// Public routes
router.get(
    "/services",
    validate({ query: listPublicServicesQuerySchema }),
    ServicesController.listPublicServices
);

router.get(
    "/services/:slug",
    validate({ params: publicServiceParamsSchema }),
    ServicesController.getPublicServiceBySlug
);

export default router;