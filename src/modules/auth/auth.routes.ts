import { Router } from 'express';
import { AuthController } from './auth.controller.ts';
import { requireAuth } from '../../core/middleware/auth.middleware.ts';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/google', authController.google.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.get('/me', requireAuth, authController.me.bind(authController));

export default router;