import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './video.controller';

const router = Router();
router.use(authMiddleware);
router.post('/sessions', asyncHandler(ctrl.create));
router.get('/sessions/:id/token', asyncHandler(ctrl.token));
router.post('/sessions/:id/end', asyncHandler(ctrl.end));

export default router;
