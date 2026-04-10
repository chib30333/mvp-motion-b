import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole(UserRole.MANAGER, UserRole.ADMIN),
  asyncHandler(async (_req, res) => {
    const [
      providersPendingApproval,
      approvedProviders,
      activeServices,
      activeSubscriptions,
      upcomingBookings,
      completedReviews,
    ] = await Promise.all([
      prisma.providerProfile.count({ where: { approvalStatus: "PENDING" } }),
      prisma.providerProfile.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.service.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.review.count(),
    ]);

    res.status(200).json({
      overview: {
        providersPendingApproval,
        approvedProviders,
        activeServices,
        activeSubscriptions,
        upcomingBookings,
        completedReviews,
      },
    });
  })
);

export default router;
