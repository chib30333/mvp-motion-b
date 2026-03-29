import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth.middleware.ts';
import { validate } from '../../core/middleware/validate.middleware.ts';
import { asyncHandler } from '../../core/utils/asyncHandler.ts';
import { AuthController } from './auth.controller.ts';
import {
    googleLoginSchema,
    loginSchema,
    registerSchema,
} from './auth.schema.ts';

const router = Router();
const authController = new AuthController();

router.post(
    '/register',
    validate({ body: registerSchema }),
    asyncHandler(authController.register.bind(authController))
);

router.post(
    '/login',
    validate({ body: loginSchema }),
    asyncHandler(authController.login.bind(authController))
);

router.post(
    '/google',
    validate({ body: googleLoginSchema }),
    asyncHandler(authController.google.bind(authController))
);

router.post(
    '/refresh',
    asyncHandler(authController.refresh.bind(authController))
);

router.post(
    '/logout',
    asyncHandler(authController.logout.bind(authController))
);

router.get(
    '/me',
    requireAuth,
    asyncHandler(authController.me.bind(authController))
);

export default router;