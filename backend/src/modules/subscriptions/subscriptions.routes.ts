import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './subscriptions.controller';

const router = Router();
router.get('/plans', asyncHandler(ctrl.plans));
router.use(authMiddleware);
router.get('/me', asyncHandler(ctrl.mine));
router.post('/', asyncHandler(ctrl.subscribe));
router.post('/:id/cancel', asyncHandler(ctrl.cancel));

export default router;
