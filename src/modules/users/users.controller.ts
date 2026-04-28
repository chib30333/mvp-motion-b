import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { usersService } from "./users.service.ts";

export const usersController = {
    async list(req: Request, res: Response) {
        const q = req.query as Record<string, string | undefined>;
        const result = await usersService.list({
            role: q.role as UserRole | undefined,
            isActive: q.isActive ? q.isActive === "true" : undefined,
            search: q.search,
            page: q.page ? Number(q.page) : 1,
            pageSize: q.pageSize ? Number(q.pageSize) : 20,
        });
        res.status(200).json({ items: result.items, meta: result.meta });
    },

    async getById(req: Request, res: Response) {
        const user = await usersService.getById(String(req.params.id));
        res.status(200).json({ success: true, data: user });
    },

    async setStatus(req: Request, res: Response) {
        const user = await usersService.setStatus(String(req.params.id), req.body.isActive);
        res.status(200).json({ success: true, data: user });
    },

    async setRole(req: Request, res: Response) {
        const user = await usersService.setRole(String(req.params.id), req.body.role);
        res.status(200).json({ success: true, data: user });
    },
};
