export type AnalyticsFilters = {
    cityId?: string;
    serviceId?: string;
    categoryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
};

export type DashboardKpis = {
    bookingsCount: number;
    confirmedBookingsCount: number;
    completedBookingsCount: number;
    cancelledBookingsCount: number;
    activeSubscriptionsCount: number;
    revenueMinor: number;
    refundsMinor: number;
    netRevenueMinor: number;
    providersApprovedCount: number;
    providersPendingCount: number;
    averageRating: number;
    fillRatePercent: number;
};

export type RevenuePoint = {
    date: string;
    revenueMinor: number;
};

export type BookingStatusBreakdown = {
    status: string;
    count: number;
};

export type TopServiceRow = {
    serviceId: string;
    title: string;
    bookingsCount: number;
    revenueMinor: number;
    averageRating: number;
};

export type TopCityRow = {
    cityId: string;
    cityName: string;
    bookingsCount: number;
    revenueMinor: number;
};

export type AnalyticsOverviewResponse = {
    filters: {
        cityId?: string;
        serviceId?: string;
        categoryId?: string;
        dateFrom?: string;
        dateTo?: string;
    };
    kpis: DashboardKpis;
    revenueSeries: RevenuePoint[];
    bookingStatusBreakdown: BookingStatusBreakdown[];
    topServices: TopServiceRow[];
    topCities: TopCityRow[];
    projection: {
        next30DaysRevenueMinor: number;
        method: string;
    };
};