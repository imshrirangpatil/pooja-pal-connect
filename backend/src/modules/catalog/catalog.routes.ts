import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { roleMiddleware } from '../../middleware/roleMiddleware';
import * as ctrl from './catalog.controller';

const router = Router();
// Public browse
router.get('/categories', asyncHandler(ctrl.listCategories));
router.get('/', asyncHandler(ctrl.listPoojas));
router.get('/:slug', asyncHandler(ctrl.getPooja));
// Admin manage
router.post('/categories', authMiddleware, roleMiddleware('admin'), asyncHandler(ctrl.upsertCategory));
router.post('/', authMiddleware, roleMiddleware('admin'), asyncHandler(ctrl.upsertPooja));

export default router;
