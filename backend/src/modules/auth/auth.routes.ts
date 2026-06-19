import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { rateLimitMiddleware } from '../../middleware/rateLimitMiddleware';
import { env } from '../../config/env';
import * as ctrl from './auth.controller';

const router = Router();

// Per-phone limiter mirrors the service-level cap (defence in depth).
const otpLimiter = rateLimitMiddleware({
  bucket: 'send-otp',
  windowSeconds: 3600,
  max: env.otpMaxRequestsPerHour,
  keyBy: (req) => (req.body?.phone ? String(req.body.phone) : req.ip ?? 'unknown'),
});

router.post('/send-otp', otpLimiter, asyncHandler(ctrl.sendOtp));
router.post('/verify-otp', asyncHandler(ctrl.verifyOtp));
router.post('/google', asyncHandler(ctrl.google));
router.post('/refresh', asyncHandler(ctrl.refresh));
router.post('/logout', authMiddleware, asyncHandler(ctrl.logout));
router.get('/me', authMiddleware, asyncHandler(ctrl.me));

export default router;
