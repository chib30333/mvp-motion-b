import { prisma } from "../../core/db/prisma.ts";
import { Prisma, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import type { AnalyticsFilters } from "./analytics.types.ts";

function buildDateFilter(filters: AnalyticsFilters) {
    if (!filters.dateFrom && !filters.dateTo) return undefined;

    return {
        gte: filters.dateFrom,
        lte: filters.dateTo,
    };
}

function buildBookingWhere(filters: AnalyticsFilters) {
    return {
        createdAt: buildDateFilter(filters),
        slot: {
            cityId: filters.cityId,
            serviceId: filters.serviceId,
            service: {
                categoryId: filters.categoryId,
            },
        },
    };
}

function buildPaymentWhere(filters: AnalyticsFilters) {
    return {
        status: "SUCCEEDED" as const,
        booking: filters.serviceId || filters.cityId || filters.categoryId || filters.dateFrom || filters.dateTo
            ? {
                slot: {
                    cityId: filters.cityId,
                    serviceId: filters.serviceId,
                    service: {
                        categoryId: filters.categoryId,
                    },
                },
            }
            : undefined,
        paidAt: buildDateFilter(filters),
    };
}

function buildRefundWhere(filters: AnalyticsFilters): Prisma.PaymentWhereInput {
    return {
        status: {
            in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED],
        },
        refundedAt: buildDateFilter(filters),
        booking:
            filters.serviceId || filters.cityId || filters.categoryId || filters.dateFrom || filters.dateTo
                ? {
                    slot: {
                        cityId: filters.cityId,
                        serviceId: filters.serviceId,
                        service: {
                            categoryId: filters.categoryId,
                        },
                    },
                }
                : undefined,
    };
}

function buildSubscriptionWhere(filters: AnalyticsFilters) {
    if (filters.cityId || filters.serviceId || filters.categoryId) {
        return {
            status: "ACTIVE" as const,
        };
    }

    return {
        status: "ACTIVE" as const,
        createdAt: buildDateFilter(filters),
    };
}

export const analyticsRepository = {
    async countBookings(filters: AnalyticsFilters) {
        return prisma.booking.count({
            where: buildBookingWhere(filters),
        });
    },

    async countBookingsByStatus(filters: AnalyticsFilters, status: string) {
        return prisma.booking.count({
            where: {
                ...buildBookingWhere(filters),
                status: status as never,
            },
        });
    },

    async countActiveSubscriptions(filters: AnalyticsFilters) {
        return prisma.subscription.count({
            where: buildSubscriptionWhere(filters),
        });
    },

    async sumSucceededRevenue(filters: AnalyticsFilters) {
        const result = await prisma.payment.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                ...buildPaymentWhere(filters),
            },
        });

        return result?._sum.amount ?? 0;
    },

    async sumRefunds(filters: AnalyticsFilters) {
        const result = await prisma.payment.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                ...buildRefundWhere(filters),
            },
        });

        return result._sum?.amount ?? 0;
    },

    async countApprovedProviders() {
        return prisma.providerProfile.count({
            where: {
                approvalStatus: "APPROVED",
            },
        });
    },

    async countPendingProviders() {
        return prisma.providerProfile.count({
            where: {
                approvalStatus: "PENDING",
            },
        });
    },

    async averageRating(filters: AnalyticsFilters) {
        const result = await prisma.review.aggregate({
            _avg: {
                rating: true,
            },
            where: {
                booking: {
                    slot: {
                        cityId: filters.cityId,
                        serviceId: filters.serviceId,
                        service: {
                            categoryId: filters.categoryId,
                        },
                    },
                },
                createdAt: buildDateFilter(filters),
            },
        });

        return result._avg.rating ?? 0;
    },

    async fillRate(filters: AnalyticsFilters) {
        const slots = await prisma.slot.findMany({
            where: {
                cityId: filters.cityId,
                serviceId: filters.serviceId,
                service: {
                    categoryId: filters.categoryId,
                },
                startsAt: buildDateFilter(filters),
            },
            select: {
                capacity: true,
                bookedCount: true,
            },
        });

        const totalCapacity = slots.reduce((sum, slot) => sum + slot.capacity, 0);
        const totalBooked = slots.reduce((sum, slot) => sum + slot.bookedCount, 0);

        return {
            totalCapacity,
            totalBooked,
        };
    },

    async bookingStatusBreakdown(filters: AnalyticsFilters) {
        const rows = await prisma.booking.groupBy({
            by: ["status"],
            _count: {
                status: true,
            },
            where: buildBookingWhere(filters),
            orderBy: {
                _count: {
                    status: "desc",
                },
            },
        });

        return rows.map((row) => ({
            status: row.status,
            count: row._count.status,
        }));
    },

    async topServices(filters: AnalyticsFilters) {
        const bookings = await prisma.booking.findMany({
            where: buildBookingWhere(filters),
            include: {
                slot: {
                    include: {
                        service: true,
                    },
                },
                review: true,
                payment: true,
            },
        });

        const map = new Map<
            string,
            {
                title: string;
                bookingsCount: number;
                revenueMinor: number;
                ratings: number[];
            }
        >();

        for (const booking of bookings) {
            const service = booking.slot.service;
            const existing = map.get(service.id) ?? {
                title: service.title,
                bookingsCount: 0,
                revenueMinor: 0,
                ratings: [],
            };

            existing.bookingsCount += 1;

            if (booking.payment?.status === "SUCCEEDED") {
                existing.revenueMinor += booking.payment.amount;
            }

            if (booking.review?.rating) {
                existing.ratings.push(booking.review.rating);
            }

            map.set(service.id, existing);
        }

        return Array.from(map.entries())
            .map(([serviceId, value]) => ({
                serviceId,
                title: value.title,
                bookingsCount: value.bookingsCount,
                revenueMinor: value.revenueMinor,
                averageRating: value.ratings.length
                    ? Number(
                        (
                            value.ratings.reduce((sum, rating) => sum + rating, 0) /
                            value.ratings.length
                        ).toFixed(2)
                    )
                    : 0,
            }))
            .sort((a, b) => b.revenueMinor - a.revenueMinor || b.bookingsCount - a.bookingsCount)
            .slice(0, 10);
    },

    async topCities(filters: AnalyticsFilters) {
        const bookings = await prisma.booking.findMany({
            where: buildBookingWhere(filters),
            include: {
                slot: {
                    include: {
                        city: true,
                    },
                },
                payment: true,
            },
        });

        const map = new Map<
            string,
            {
                cityName: string;
                bookingsCount: number;
                revenueMinor: number;
            }
        >();

        for (const booking of bookings) {
            const city = booking.slot.city;
            const existing = map.get(city.id) ?? {
                cityName: city.name,
                bookingsCount: 0,
                revenueMinor: 0,
            };

            existing.bookingsCount += 1;

            if (booking.payment?.status === "SUCCEEDED") {
                existing.revenueMinor += booking.payment.amount;
            }

            map.set(city.id, existing);
        }

        return Array.from(map.entries())
            .map(([cityId, value]) => ({
                cityId,
                cityName: value.cityName,
                bookingsCount: value.bookingsCount,
                revenueMinor: value.revenueMinor,
            }))
            .sort((a, b) => b.revenueMinor - a.revenueMinor || b.bookingsCount - a.bookingsCount)
            .slice(0, 10);
    },

    async revenueSeries(filters: AnalyticsFilters) {
        const payments = await prisma.payment.findMany({
            where: {
                ...buildPaymentWhere(filters),
            },
            select: {
                amount: true,
                paidAt: true,
            },
            orderBy: {
                paidAt: "asc",
            },
        });

        const byDate = new Map<string, number>();

        for (const payment of payments) {
            if (!payment.paidAt) continue;
            const date = payment.paidAt.toISOString().slice(0, 10);
            byDate.set(date, (byDate.get(date) ?? 0) + payment.amount);
        }

        return Array.from(byDate.entries()).map(([date, revenueMinor]) => ({
            date,
            revenueMinor,
        }));
    },

    async exportBookings(filters: AnalyticsFilters) {
        const bookings = await prisma.booking.findMany({
            where: buildBookingWhere(filters),
            include: {
                user: true,
                slot: {
                    include: {
                        city: true,
                        service: {
                            include: {
                                provider: true,
                                category: true,
                            },
                        },
                    },
                },
                payment: true,
                review: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return bookings.map((booking) => ({
            bookingId: booking.id,
            bookingStatus: booking.status,
            bookingCreatedAt: booking.createdAt.toISOString(),
            customerEmail: booking.user.email,
            customerName: booking.user.fullName ?? "",
            city: booking.slot.city.name,
            serviceTitle: booking.slot.service.title,
            category: booking.slot.service.category.name,
            providerName: booking.slot.service.provider.brandName,
            slotStartsAt: booking.slot.startsAt.toISOString(),
            slotEndsAt: booking.slot.endsAt.toISOString(),
            totalAmountMinor: booking.totalAmount,
            paymentStatus: booking.payment?.status ?? "",
            paidAmountMinor: booking.payment?.amount ?? "",
            refundedAt: booking.payment?.refundedAt?.toISOString() ?? "",
            rating: booking.review?.rating ?? "",
            reviewComment: booking.review?.comment ?? "",
        }));
    },
};