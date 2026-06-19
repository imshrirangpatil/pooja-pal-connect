import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { roleMiddleware } from '../../middleware/roleMiddleware';
import * as ctrl from './kits.controller';

const router = Router();
router.get('/', asyncHandler(ctrl.list));
router.get('/inventory', authMiddleware, roleMiddleware('admin'), asyncHandler(ctrl.getInventory));
router.put('/inventory', authMiddleware, roleMiddleware('admin'), asyncHandler(ctrl.setInventory));
router.get('/:slug', asyncHandler(ctrl.get));
router.post('/', authMiddleware, roleMiddleware('admin'), asyncHandler(ctrl.upsert));

export default router;
