import type { Request, Response } from "express";
import { uploadsService } from "./uploads.service.ts";

export const uploadsController = {
    async registerProviderDocument(req: Request, res: Response) {
        const doc = await uploadsService.registerProviderDocument({
            userId: req.user!.userId,
            role: req.user!.role,
            fileUrl: req.body.fileUrl,
            fileName: req.body.fileName,
            mimeType: req.body.mimeType,
        });
        res.status(201).json({ success: true, data: doc });
    },

    async listMyProviderDocuments(req: Request, res: Response) {
        const docs = await uploadsService.listMyProviderDocuments(
            req.user!.userId,
            req.user!.role
        );
        res.status(200).json({ success: true, data: docs });
    },
};
