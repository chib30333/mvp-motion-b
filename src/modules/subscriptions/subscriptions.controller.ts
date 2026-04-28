import type { Request, Response } from "express";
import { subscriptionsService } from "./subscriptions.service.ts";

export const subscriptionsController = {
    async listPlans(_req: Request, res: Response) {
        const plans = await subscriptionsService.listPlans();
        res.status(200).json({ success: true, data: plans });
    },

    async getMyActive(req: Request, res: Response) {
        const sub = await subscriptionsService.getMyActiveSubscription(
            req.user!.userId
        );
        res.status(200).json({ success: true, data: sub });
    },

    async listMine(req: Request, res: Response) {
        const subs = await subscriptionsService.listMine(req.user!.userId);
        res.status(200).json({ success: true, data: subs });
    },

    async cancelMine(req: Request, res: Response) {
        const result = await subscriptionsService.cancelMine(
            req.user!.userId,
            Boolean(req.body.immediate)
        );
        res.status(200).json({ success: true, data: result });
    },
};
