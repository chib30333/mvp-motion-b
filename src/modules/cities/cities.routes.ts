import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { validate } from "../../core/middleware/validate.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";
import { citiesController } from "./cities.controller.ts";
import {
    createCitySchema,
    updateCitySchema,
    cityParamsSchema,
    listCitiesQuerySchema,
} from "./cities.schema.ts";

const router = Router();

router.get(
    "/",
    validate({ query: listCitiesQuerySchema }),
    asyncHandler(citiesController.list)
);

router.post(
    "/",
    requireAuth,
    requireRole(UserRole.MANAGER, UserRole.ADMIN),
    validate({ body: createCitySchema }),
    asyncHandler(citiesController.create)
);

router.patch(
    "/:id",
    requireAuth,
    requireRole(UserRole.MANAGER, UserRole.ADMIN),
    validate({ params: cityParamsSchema, body: updateCitySchema }),
    asyncHandler(citiesController.update)
);

router.delete(
    "/:id",
    requireAuth,
    requireRole(UserRole.MANAGER, UserRole.ADMIN),
    validate({ params: cityParamsSchema }),
    asyncHandler(citiesController.deactivate)
);

export default router;
