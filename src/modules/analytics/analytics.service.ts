import type {
    AnalyticsFilters,
    AnalyticsOverviewResponse,
    DashboardKpis,
} from "./analytics.types.ts";
import { analyticsRepository } from "./analytics.repository.ts";

function normalizeFilters(input: {
    cityId?: string;
    serviceId?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
}): AnalyticsFilters {
    return {
        cityId: input.cityId,
        serviceId: input.serviceId,
        categoryId: input.categoryId,
        dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
        dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
    };
}

export const analyticsService = {
    normalizeFilters,

    async getOverview(rawFilters: {
        cityId?: string;
        serviceId?: string;
        categoryId?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<AnalyticsOverviewResponse> {
        const filters = normalizeFilters(rawFilters);

        const [
            bookingsCount,
            confirmedBookingsCount,
            completedBookingsCount,
            cancelledBookingsCount,
            activeSubscriptionsCount,
            revenueMinor,
            refundsMinor,
            providersApprovedCount,
            providersPendingCount,
            averageRating,
            fillRateData,
            bookingStatusBreakdown,
            topServices,
            topCities,
            revenueSeries,
        ] = await Promise.all([
            analyticsRepository.countBookings(filters),
            analyticsRepository.countBookingsByStatus(filters, "CONFIRMED"),
            analyticsRepository.countBookingsByStatus(filters, "COMPLETED"),
            analyticsRepository.countBookingsByStatus(filters, "CANCELLED"),
            analyticsRepository.countActiveSubscriptions(filters),
            analyticsRepository.sumSucceededRevenue(filters),
            analyticsRepository.sumRefunds(filters),
            analyticsRepository.countApprovedProviders(),
            analyticsRepository.countPendingProviders(),
            analyticsRepository.averageRating(filters),
            analyticsRepository.fillRate(filters),
            analyticsRepository.bookingStatusBreakdown(filters),
            analyticsRepository.topServices(filters),
            analyticsRepository.topCities(filters),
            analyticsRepository.revenueSeries(filters),
        ]);

        const fillRatePercent =
            fillRateData.totalCapacity > 0
                ? Number(
                    (
                        (fillRateData.totalBooked / fillRateData.totalCapacity) *
                        100
                    ).toFixed(2)
                )
                : 0;

        const kpis: DashboardKpis = {
            bookingsCount,
            confirmedBookingsCount,
            completedBookingsCount,
            cancelledBookingsCount,
            activeSubscriptionsCount,
            revenueMinor,
            refundsMinor,
            netRevenueMinor: revenueMinor - refundsMinor,
            providersApprovedCount,
            providersPendingCount,
            averageRating: Number(Number(averageRating).toFixed(2)),
            fillRatePercent,
        };

        const next30DaysRevenueMinor = this.projectNext30DaysRevenue(revenueSeries);

        return {
            filters: {
                cityId: rawFilters.cityId,
                serviceId: rawFilters.serviceId,
                categoryId: rawFilters.categoryId,
                dateFrom: rawFilters.dateFrom,
                dateTo: rawFilters.dateTo,
            },
            kpis,
            revenueSeries,
            bookingStatusBreakdown,
            topServices,
            topCities,
            projection: {
                next30DaysRevenueMinor,
                method: "Simple daily average projection based on filtered revenue series",
            },
        };
    },

    projectNext30DaysRevenue(
        revenueSeries: { date: string; revenueMinor: number }[]
    ): number {
        if (!revenueSeries.length) return 0;

        const totalRevenue = revenueSeries.reduce(
            (sum, point) => sum + point.revenueMinor,
            0
        );

        const days = revenueSeries.length;
        const averagePerDay = totalRevenue / days;

        return Math.round(averagePerDay * 30);
    },
};