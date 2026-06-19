import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { roleMiddleware } from '../../middleware/roleMiddleware';
import * as ctrl from './festivals.controller';

const router = Router();
router.get('/', asyncHandler(ctrl.festivals));
router.get('/muhurats', asyncHandler(ctrl.muhurats));
router.post('/', authMiddleware, roleMiddleware('admin'), asyncHandler(ctrl.addFestival));
router.post('/muhurats', authMiddleware, roleMiddleware('admin'), asyncHandler(ctrl.addMuhurat));

export default router;
