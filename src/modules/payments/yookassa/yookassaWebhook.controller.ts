// src/modules/payments/yookassa/yookassaWebhook.controller.ts

import type { Request, Response } from 'express';
import { yookassaService } from './yookassa.service.ts';
import { paymentsService } from '../payments.service.ts';

export const yookassaWebhookController = {
    async handle(req: Request, res: Response) {
        const normalized = yookassaService.normalizeWebhookEvent(req.body);

        await paymentsService.processWebhookEvent(normalized);

        return res.status(200).json({ received: true });
    },
};