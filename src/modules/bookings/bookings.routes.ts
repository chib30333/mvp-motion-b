import { Router } from "express";
import { bookingsController } from "./bookings.controller.ts";
import { requireAuth } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";
import { UserRole } from "@prisma/client";

const router = Router();

// Customer / generic authenticated user
router.post(
    "/bookings",
    requireAuth,
    requireRole(UserRole.CUSTOMER, UserRole.PROVIDER),
    asyncHandler(bookingsController.createBooking)
);

router.get(
    "/bookings/me",
    requireAuth,
    asyncHandler(bookingsController.getMyBookings)
);

router.get(
    "/bookings/:id",
    requireAuth,
    asyncHandler(bookingsController.getMyBookingById)
);

router.post(
    "/bookings/:bookingId/cancel",
    requireAuth,
    asyncHandler(bookingsController.cancelBooking)
);

// Provider
router.get(
    "/provider/bookings",
    requireAuth,
    requireRole(UserRole.PROVIDER),
    asyncHandler(bookingsController.getProviderBookings)
);

router.get(
    "/provider/bookings/:id",
    requireAuth,
    requireRole(UserRole.PROVIDER),
    asyncHandler(bookingsController.getProviderBookingById)
);

export default router;