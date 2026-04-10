import type { Request, Response } from "express";
import { referenceDataService } from "./referenceData.service.ts";

export const referenceDataController = {
  async getAll(_req: Request, res: Response) {
    const data = await referenceDataService.getReferenceData();
    res.status(200).json(data);
  },
};
