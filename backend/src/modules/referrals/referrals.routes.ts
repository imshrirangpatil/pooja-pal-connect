import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './referrals.controller';

const router = Router();
router.use(authMiddleware);
router.get('/me', asyncHandler(ctrl.mine));
router.post('/apply', asyncHandler(ctrl.apply));

export default router;
