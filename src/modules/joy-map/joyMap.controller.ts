import type { Request, Response, NextFunction } from "express";
import { JoyMapService } from "./joyMap.service.ts";

export class JoyMapController {
    constructor(private readonly joyMapService: JoyMapService) { }

    generateCurrentWeek = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = (req as any).user.id;
            const result = await this.joyMapService.generateCurrentWeek(userId, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getCurrentWeek = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = (req as any).user.id;
            const result = await this.joyMapService.getCurrentWeek(userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getHistory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const userId = (req as any).user.id;
            const limit = Number(req.query.limit ?? 8);
            const result = await this.joyMapService.getHistory(userId, limit);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}