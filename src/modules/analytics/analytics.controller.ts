import type { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service.ts";
import { analyticsExportService } from "./analyticsExport.service.ts";

export const analyticsController = {
    async getOverview(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsService.getOverview({
                cityId: req.query.cityId as string | undefined,
                serviceId: req.query.serviceId as string | undefined,
                categoryId: req.query.categoryId as string | undefined,
                dateFrom: req.query.dateFrom as string | undefined,
                dateTo: req.query.dateTo as string | undefined,
            });

            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    },

    async exportBookingsCsv(req: Request, res: Response, next: NextFunction) {
        try {
            const csv = await analyticsExportService.exportBookingsCsv({
                cityId: req.query.cityId as string | undefined,
                serviceId: req.query.serviceId as string | undefined,
                categoryId: req.query.categoryId as string | undefined,
                dateFrom: req.query.dateFrom as string | undefined,
                dateTo: req.query.dateTo as string | undefined,
            });

            const filename = `analytics-bookings-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`
            );

            res.status(200).send(csv);
        } catch (error) {
            next(error);
        }
    },
};