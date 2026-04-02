// src/modules/payments/payments.controller.ts

import type { Request, Response } from 'express';
import { paymentsService } from './payments.service.ts';
import { bookingIdRouteParamSchema } from '../bookings/bookings.schema.ts';

export const paymentsController = {
    async createBookingCheckout(req: Request, res: Response) {
        const { bookingId } = bookingIdRouteParamSchema.parse(req.params)

        const result = await paymentsService.createBookingCheckout({
            bookingId: bookingId,
            userId: req.user!.userId,
            provider: req.body.provider,
        });

        res.status(200).json(result);
    },

    async createSubscriptionCheckout(req: Request, res: Response) {
        const result = await paymentsService.createSubscriptionCheckout({
            userId: req.user!.userId,
            planCode: req.body.planCode,
            provider: req.body.provider,
        });

        res.status(200).json(result);
    },
};