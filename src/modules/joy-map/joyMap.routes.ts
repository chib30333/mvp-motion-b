import { Router } from "express";
import { validateBody } from "../../core/middleware/validate.middleware.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { generateJoyMapRequestSchema } from "./joyMap.schema.ts";
import { JoyMapController } from "./joyMap.controller.ts";

export const buildJoyMapRoutes = (controller: JoyMapController) => {
    const router = Router();

    router.post(
        "/generate",
        requireAuth,
        requireRole("CUSTOMER"),
        validateBody(generateJoyMapRequestSchema),
        controller.generateCurrentWeek
    );

    router.get(
        "/me/current",
        requireAuth,
        requireRole("CUSTOMER"),
        controller.getCurrentWeek
    );

    router.get(
        "/me/history",
        requireAuth,
        requireRole("CUSTOMER"),
        controller.getHistory
    );

    return router;
};