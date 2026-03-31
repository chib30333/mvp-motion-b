import type { Request, Response } from "express";
import { bookingsService } from "./bookings.service.ts";
import {
    bookingListQuerySchema,
    cancelBookingSchema,
    createBookingSchema,
    bookingIdParamSchema,
    bookingIdRouteParamSchema
} from "./bookings.schema.ts";
import { toBookingResponseDto } from "./bookings.mapper.ts";

export class BookingsController {
    createBooking = async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        const input = createBookingSchema.parse(req.body);

        const booking = await bookingsService.createBooking(userId!, input);

        return res.status(201).json({
            booking: toBookingResponseDto(booking),
        });
    };

    getMyBookings = async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        const query = bookingListQuerySchema.parse(req.query);

        const bookings = await bookingsService.getMyBookings(userId!, query);

        return res.status(200).json({
            bookings: bookings.map(toBookingResponseDto),
        });
    };

    getMyBookingById = async (req: Request, res: Response) => {
        const userId = req.user?.userId;

        const { id } = bookingIdParamSchema.parse(req.params);

        const booking = await bookingsService.getMyBookingById(userId!, id);

        return res.status(200).json({
            booking: toBookingResponseDto(booking),
        });
    };

    cancelBooking = async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        const { bookingId } = bookingIdRouteParamSchema.parse(req.params);
        const input = cancelBookingSchema.parse(req.body);

        const result = await bookingsService.cancelBooking(userId!, bookingId, input.reason);

        return res.status(200).json({
            booking: toBookingResponseDto(result.booking),
            refundEligible: result.refundEligible,
        });
    };

    getProviderBookings = async (req: Request, res: Response) => {
        const providerUserId = req.user?.userId;
        const query = bookingListQuerySchema.parse(req.query);

        const bookings = await bookingsService.getProviderBookings(providerUserId!, query);

        return res.status(200).json({
            bookings: bookings.map(toBookingResponseDto),
        });
    };

    getProviderBookingById = async (req: Request, res: Response) => {
        const providerUserId = req.user?.userId;
        const { id } = bookingIdParamSchema.parse(req.params);

        const booking = await bookingsService.getProviderBookingById(providerUserId!, id);

        return res.status(200).json({
            booking: toBookingResponseDto(booking),
        });
    };
}

export const bookingsController = new BookingsController();