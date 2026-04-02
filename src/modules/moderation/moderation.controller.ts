import type { Request, Response, NextFunction } from "express";
import moderationService from "./moderation.service.ts";
import {
    adminListProvidersQuerySchema,
    rejectProviderSchema,
} from "./moderation.schema.ts";
import { ProviderApprovalStatus, UserRole } from "@prisma/client";

type RequestUser = {
    id: string;
    role: UserRole;
};

type ProviderIdParams = {
    providerId: string;
};

function getUser(req: Request): RequestUser {
    const user = req.user as RequestUser | undefined;

    if (!user) {
        const error = new Error("Unauthorized");
        (error as any).statusCode = 401;
        throw error;
    }

    return user;
}

class ModerationController {
    submitMyApplication = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const user = getUser(req);
            const result = await moderationService.submitProviderApplication(user);

            res.status(200).json({
                success: true,
                message: "Provider application submitted successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    getMyApplicationStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const user = getUser(req);
            const result = await moderationService.getMyApplicationStatus(user);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    listProviders = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = adminListProvidersQuerySchema.parse(req.query);

            const result = await moderationService.listProvidersForAdmin({
                status: query.status as ProviderApprovalStatus | undefined,
                cityId: query.cityId,
                search: query.search,
                page: query.page,
                limit: query.limit,
            });

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    getProviderDetail = async (
        req: Request<ProviderIdParams>,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const result = await moderationService.getProviderModerationDetail(
                req.params.providerId
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    approveProvider = async (
        req: Request<ProviderIdParams>,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const user = getUser(req);
            const result = await moderationService.approveProvider(
                user,
                req.params.providerId
            );

            res.status(200).json({
                success: true,
                message: "Provider approved successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    rejectProvider = async (
        req: Request<ProviderIdParams>,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const user = getUser(req);
            const body = rejectProviderSchema.parse(req.body);

            const result = await moderationService.rejectProvider(
                user,
                req.params.providerId,
                body.reason
            );

            res.status(200).json({
                success: true,
                message: "Provider rejected successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new ModerationController();