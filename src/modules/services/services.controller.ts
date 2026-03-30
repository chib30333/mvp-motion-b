import type { Request, Response } from "express";
import { servicesService } from "./services.service.ts";

export class ServicesController {
    static async createService(req: Request, res: Response) {
        const result = await servicesService.createService({
            userId: req.user!.userId,
            input: req.body,
        });

        return res.status(201).json(result);
    }

    static async listProviderServices(req: Request, res: Response) {
        const result = await servicesService.listProviderServices({
            userId: req.user!.userId,
            query: req.query as any,
        });

        return res.status(200).json(result);
    }

    static async getProviderServiceById(req: Request, res: Response) {
        const result = await servicesService.getProviderServiceById({
            userId: req.user!.userId,
            serviceId: req.params.id as string,
        });

        return res.status(200).json(result);
    }

    static async updateService(req: Request, res: Response) {
        const result = await servicesService.updateService({
            userId: req.user!.userId,
            serviceId: req.params.id as string,
            input: req.body,
        });

        return res.status(200).json(result);
    }

    static async updateServiceStatus(req: Request, res: Response) {
        const result = await servicesService.updateServiceStatus({
            userId: req.user!.userId,
            serviceId: req.params.id as string,
            status: req.body.status,
        });

        return res.status(200).json(result);
    }

    static async archiveService(req: Request, res: Response) {
        const result = await servicesService.archiveService({
            userId: req.user!.userId,
            serviceId: req.params.id as string,
        });

        return res.status(200).json(result);
    }

    static async listPublicServices(req: Request, res: Response) {
        const result = await servicesService.listPublicServices({
            query: req.query as any,
        });

        return res.status(200).json(result);
    }

    static async getPublicServiceBySlug(req: Request, res: Response) {
        const result = await servicesService.getPublicServiceBySlug({
            slug: req.params.slug as string,
        });

        return res.status(200).json(result);
    }
}