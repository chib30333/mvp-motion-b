import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.ts';
import customerProfileRoutes from "../modules/customer-profile/customerProfile.routes.ts";
import providersRoutes from "../modules/providers/providers.routes.ts";

const router = Router();

router.use('/auth', authRoutes);
router.use("/customer-profile", customerProfileRoutes);
router.use("/providers", providersRoutes);

export default router;