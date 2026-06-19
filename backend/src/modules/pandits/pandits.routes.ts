import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { roleMiddleware } from '../../middleware/roleMiddleware';
import * as ctrl from './pandits.controller';

const router = Router();
router.get('/', asyncHandler(ctrl.listPandits));
router.get('/:id', asyncHandler(ctrl.getPandit));
router.get('/:id/availability', asyncHandler(ctrl.getAvailability));
// Admin or pandit management
router.post('/', authMiddleware, roleMiddleware('admin', 'pandit'), asyncHandler(ctrl.upsertPandit));
router.post('/:id/availability', authMiddleware, roleMiddleware('admin', 'pandit'), asyncHandler(ctrl.addAvailability));

export default router;
