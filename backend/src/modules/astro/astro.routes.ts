import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './astro.controller';

const router = Router();
router.use(authMiddleware);
router.post('/sessions', asyncHandler(ctrl.start));
router.get('/sessions/:id/messages', asyncHandler(ctrl.messages));
router.post('/sessions/:id/messages', asyncHandler(ctrl.message));
router.post('/sessions/:id/end', asyncHandler(ctrl.end));

export default router;
