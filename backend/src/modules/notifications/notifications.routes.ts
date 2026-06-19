import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './notifications.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', asyncHandler(ctrl.list));
router.put('/:id/read', asyncHandler(ctrl.markRead));
router.put('/read-all', asyncHandler(ctrl.markAllRead));

export default router;
