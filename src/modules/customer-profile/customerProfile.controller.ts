import type { Request, Response, NextFunction } from "express";
import { customerProfileService } from "./customerProfile.service.ts";

export const customerProfileController = {
    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await customerProfileService.getMe(
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
            const result = await customerProfileService.updateMe(
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

    async submitOnboarding(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await customerProfileService.submitOnboarding(
                req.user!.userId,
                req.user!.role,
                req.body
            );

            res.status(200).json({
                success: true,
                message: "Customer onboarding completed",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },
};