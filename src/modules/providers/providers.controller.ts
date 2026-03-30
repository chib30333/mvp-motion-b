import type { Request, Response, NextFunction } from "express";
import { providersService } from "./providers.service.ts";

export const providersController = {
    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await providersService.getMe(
                req.user!.userId,
                req.user!.role
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async updateMe(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await providersService.updateMe(
                req.user!.userId,
                req.user!.role,
                req.body
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async submitForApproval(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await providersService.submitForApproval(
                req.user!.userId,
                req.user!.role
            );

            res.status(200).json({
                success: true,
                message: "Provider profile submitted for moderation",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },
};