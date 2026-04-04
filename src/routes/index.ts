import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.ts';
import customerProfileRoutes from "../modules/customer-profile/customerProfile.routes.ts";
import providersRoutes from "../modules/providers/providers.routes.ts";
import { paymentsRouter } from '../modules/payments/payments.routes.ts';
import { paymentsWebhookRouter } from '../modules/payments/payments.routes.ts';
// import { createJoyMapModule } from '../modules/joy-map/jobMap.module.ts';
import moderationRoutes from "../modules/moderation/moderation.routes.ts";
import analyticsRoutes from "../modules/analytics/analytics.routes.ts";


import { prisma } from '../core/db/prisma.ts';

const router = Router();
// const joyMapModule = createJoyMapModule(prisma)

router.use('/auth', authRoutes);
router.use("/customer-profile", customerProfileRoutes);
router.use("/providers", providersRoutes);
router.use('/payments', paymentsRouter);
router.use('/webhooks', paymentsWebhookRouter);
// router.use('/joy-map', joyMapModule.routes);
router.use("/v1", moderationRoutes);
router.use("/analytics", analyticsRoutes);


export default router;