import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { roleMiddleware } from '../../middleware/roleMiddleware';
import * as ctrl from './support.controller';

const router = Router();
router.use(authMiddleware);
router.post('/', asyncHandler(ctrl.create));
router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
router.post('/:id/reply', asyncHandler(ctrl.reply));
router.put('/:id/status', roleMiddleware('admin'), asyncHandler(ctrl.setStatus));

export default router;
