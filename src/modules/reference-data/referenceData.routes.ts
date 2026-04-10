import { Router } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";
import { referenceDataController } from "./referenceData.controller.ts";

const router = Router();

router.get("/", asyncHandler(referenceDataController.getAll));

export default router;
