import type { Request, Response } from "express";
import { promotionsService } from "./promotions.service.ts";

export const promotionsController = {
    async list(_req: Request, res: Response) {
        const items = await promotionsService.list();
        res.status(200).json({ success: true, data: items });
    },

    async getById(req: Request, res: Response) {
        const item = await promotionsService.getById(String(req.params.id));
        res.status(200).json({ success: true, data: item });
    },

    async create(req: Request, res: Response) {
        const created = await promotionsService.create({
            createdByUserId: req.user!.userId,
            ...req.body,
        });
        res.status(201).json({ success: true, data: created });
    },

    async update(req: Request, res: Response) {
        const updated = await promotionsService.update(String(req.params.id), req.body);
        res.status(200).json({ success: true, data: updated });
    },

    async send(req: Request, res: Response) {
        const result = await promotionsService.send(String(req.params.id));
        res.status(200).json({ success: true, data: result });
    },
};
