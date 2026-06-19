import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './reviews.controller';

const router = Router();
router.get('/', asyncHandler(ctrl.list));            // public
router.post('/', authMiddleware, asyncHandler(ctrl.create));

export default router;
