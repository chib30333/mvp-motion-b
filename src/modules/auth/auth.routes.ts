import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth.middleware.ts';
import { validate } from '../../core/middleware/validate.middleware.ts';
import { asyncHandler } from '../../core/utils/asyncHandler.ts';
import { AuthController } from './auth.controller.ts';
import {
    changePasswordSchema,
    forgotPasswordSchema,
    googleLoginSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    updateMeSchema,
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
    '/forgot-password',
    validate({ body: forgotPasswordSchema }),
    asyncHandler(authController.forgotPassword.bind(authController))
);

router.post(
    '/reset-password',
    validate({ body: resetPasswordSchema }),
    asyncHandler(authController.resetPassword.bind(authController))
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

router.patch(
    '/me',
    requireAuth,
    validate({ body: updateMeSchema }),
    asyncHandler(authController.updateMe.bind(authController))
);

router.post(
    '/change-password',
    requireAuth,
    validate({ body: changePasswordSchema }),
    asyncHandler(authController.changePassword.bind(authController))
);

export default router;
