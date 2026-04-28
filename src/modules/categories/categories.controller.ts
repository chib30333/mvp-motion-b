import type { Request, Response } from "express";
import { categoriesService } from "./categories.service.ts";

export const categoriesController = {
    async list(req: Request, res: Response) {
        const isActive = req.query.isActive
            ? req.query.isActive === "true"
            : undefined;
        const items = await categoriesService.list({ isActive });
        res.status(200).json({ success: true, data: items });
    },

    async create(req: Request, res: Response) {
        const created = await categoriesService.create(req.body);
        res.status(201).json({ success: true, data: created });
    },

    async update(req: Request, res: Response) {
        const updated = await categoriesService.update(String(req.params.id), req.body);
        res.status(200).json({ success: true, data: updated });
    },

    async deactivate(req: Request, res: Response) {
        const updated = await categoriesService.deactivate(String(req.params.id));
        res.status(200).json({ success: true, data: updated });
    },
};
