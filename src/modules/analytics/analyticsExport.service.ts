import { analyticsRepository } from "./analytics.repository.ts";
import { analyticsService } from "./analytics.service.ts";
import { buildCsv } from "../../core/utils/csv.ts";

export const analyticsExportService = {
    async exportBookingsCsv(rawFilters: {
        cityId?: string;
        serviceId?: string;
        categoryId?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        const filters = analyticsService.normalizeFilters(rawFilters);
        const rows = await analyticsRepository.exportBookings(filters);
        return buildCsv(rows);
    },
};