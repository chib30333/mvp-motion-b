import type { Request, Response } from "express";
import { citiesService } from "./cities.service.ts";

export const citiesController = {
    async list(req: Request, res: Response) {
        const isActive = req.query.isActive
            ? req.query.isActive === "true"
            : undefined;
        const items = await citiesService.list({ isActive });
        res.status(200).json({ success: true, data: items });
    },

    async create(req: Request, res: Response) {
        const created = await citiesService.create(req.body);
        res.status(201).json({ success: true, data: created });
    },

    async update(req: Request, res: Response) {
        const updated = await citiesService.update(String(req.params.id), req.body);
        res.status(200).json({ success: true, data: updated });
    },

    async deactivate(req: Request, res: Response) {
        const updated = await citiesService.deactivate(String(req.params.id));
        res.status(200).json({ success: true, data: updated });
    },
};
