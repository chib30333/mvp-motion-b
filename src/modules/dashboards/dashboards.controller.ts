import type { Request, Response } from "express";
import { dashboardsService } from "./dashboards.service.ts";

export const dashboardsController = {
  async getCustomerAccount(req: Request, res: Response) {
    const data = await dashboardsService.getCustomerDashboard(req.user!.userId);
    res.status(200).json({ success: true, data });
  },

  async getProviderPanel(req: Request, res: Response) {
    const data = await dashboardsService.getProviderDashboard(req.user!.userId);
    res.status(200).json({ success: true, data });
  },

  async getAdminPanel(_req: Request, res: Response) {
    const data = await dashboardsService.getAdminDashboard();
    res.status(200).json({ success: true, data });
  },
};
