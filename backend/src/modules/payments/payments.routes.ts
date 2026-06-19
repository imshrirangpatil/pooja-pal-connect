import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './payments.controller';

const router = Router();
router.use(authMiddleware);
router.post('/initiate', asyncHandler(ctrl.initiate));
router.post('/confirm', asyncHandler(ctrl.confirm));
router.get('/', asyncHandler(ctrl.list));

export default router;
