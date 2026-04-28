import { BookingStatus } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { BadRequestError } from "../../core/errors/BadRequestError.ts";
import { ConflictError } from "../../core/errors/ConflictError.ts";
import { ForbiddenError } from "../../core/errors/ForbiddenError.ts";
import { NotFoundError } from "../../core/errors/NotFoundError.ts";

type CreateReviewInput = {
    userId: string;
    bookingId: string;
    rating: number;
    comment?: string;
};

const recomputeProviderRating = async (providerId: string) => {
    const aggregate = await prisma.review.aggregate({
        where: { providerId },
        _avg: { rating: true },
        _count: { _all: true },
    });

    await prisma.providerProfile.update({
        where: { id: providerId },
        data: {
            averageRating: aggregate._avg.rating ?? 0,
            totalReviews: aggregate._count._all,
        },
    });
};

const recomputeServiceRating = async (serviceId: string) => {
    const reviews = await prisma.review.findMany({
        where: { booking: { slot: { serviceId } } },
        select: { rating: true },
    });

    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;

    await prisma.service.update({
        where: { id: serviceId },
        data: {
            ratingAverage: avg,
            ratingCount: total,
        },
    });
};

export const reviewsService = {
    async create(input: CreateReviewInput) {
        const booking = await prisma.booking.findUnique({
            where: { id: input.bookingId },
            include: {
                slot: { include: { service: true, provider: true } },
                review: true,
            },
        });

        if (!booking) throw new NotFoundError("Booking not found");
        if (booking.userId !== input.userId) {
            throw new ForbiddenError("You can only review your own bookings");
        }
        if (booking.status !== BookingStatus.COMPLETED) {
            throw new BadRequestError("You can only review completed bookings");
        }
        if (booking.review) {
            throw new ConflictError("Review already submitted for this booking");
        }

        const review = await prisma.review.create({
            data: {
                bookingId: booking.id,
                userId: input.userId,
                providerId: booking.slot.providerId,
                rating: input.rating,
                comment: input.comment ?? null,
            },
        });

        await Promise.all([
            recomputeProviderRating(booking.slot.providerId),
            recomputeServiceRating(booking.slot.serviceId),
        ]);

        return review;
    },

    async listByProvider(providerId: string, page: number, pageSize: number) {
        const [items, total] = await Promise.all([
            prisma.review.findMany({
                where: { providerId },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                },
            }),
            prisma.review.count({ where: { providerId } }),
        ]);

        return {
            items,
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
            },
        };
    },

    async getMine(userId: string) {
        return prisma.review.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                booking: {
                    include: {
                        slot: { include: { service: { select: { id: true, slug: true, title: true } } } },
                    },
                },
            },
        });
    },
};
