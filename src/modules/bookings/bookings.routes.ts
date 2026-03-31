import { Router } from "express";
import { bookingsController } from "./bookings.controller.ts";
import { authMiddleware } from "../../core/middleware/auth.middleware.ts";
import { requireRole } from "../../core/middleware/role.middleware.ts";
import { asyncHandler } from "../../core/utils/asyncHandler.ts";

const router = Router();

// Customer / generic authenticated user
router.post(
    "/bookings",
    authMiddleware,
    requireRole(["CUSTOMER", "PROVIDER"]),
    asyncHandler(bookingsController.createBooking)
);

router.get(
    "/bookings/me",
    authMiddleware,
    asyncHandler(bookingsController.getMyBookings)
);

router.get(
    "/bookings/:id",
    authMiddleware,
    asyncHandler(bookingsController.getMyBookingById)
);

router.post(
    "/bookings/:bookingId/cancel",
    authMiddleware,
    asyncHandler(bookingsController.cancelBooking)
);

// Provider
router.get(
    "/provider/bookings",
    authMiddleware,
    requireRole(["PROVIDER"]),
    asyncHandler(bookingsController.getProviderBookings)
);

router.get(
    "/provider/bookings/:id",
    authMiddleware,
    requireRole(["PROVIDER"]),
    asyncHandler(bookingsController.getProviderBookingById)
);

export default router;