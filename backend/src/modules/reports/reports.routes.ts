import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './reports.controller';

const router = Router();
router.use(authMiddleware);
router.post('/', asyncHandler(ctrl.request));
router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.get));
export default router;
