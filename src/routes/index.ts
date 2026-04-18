import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.ts';
import customerProfileRoutes from "../modules/customer-profile/customerProfile.routes.ts";
import providersRoutes from "../modules/providers/providers.routes.ts";
import servicesRoutes from "../modules/services/services.routes.ts";
import slotsRoutes from "../modules/slots/slots.routes.ts";
import bookingsRoutes from "../modules/bookings/bookings.routes.ts";
import { paymentsRouter } from '../modules/payments/payments.routes.ts';
import { paymentsWebhookRouter } from '../modules/payments/payments.routes.ts';
// import { createJoyMapModule } from '../modules/joy-map/jobMap.module.ts';
import moderationRoutes from "../modules/moderation/moderation.routes.ts";
import analyticsRoutes from "../modules/analytics/analytics.routes.ts";
import referenceDataRoutes from "../modules/reference-data/referenceData.routes.ts";
import managerDashboardRoutes from "../modules/manager-dashboard/managerDashboard.routes.ts";

import { prisma } from '../core/db/prisma.ts';

const router = Router();
// const joyMapModule = createJoyMapModule(prisma)

router.use('/auth', authRoutes);
router.use("/reference-data", referenceDataRoutes);
router.use("/customer-profile", customerProfileRoutes);
router.use("/providers", providersRoutes);
router.use("/", servicesRoutes);
router.use("/", slotsRoutes);
router.use("/", bookingsRoutes);
router.use('/payments', paymentsRouter);
router.use('/webhooks', paymentsWebhookRouter);
// router.use('/joy-map', joyMapModule.routes);
router.use("/manager", moderationRoutes);
router.use("/manager/analytics", analyticsRoutes);
router.use("/manager/dashboard", managerDashboardRoutes);
router.use("/analytics", analyticsRoutes);


export default router;
