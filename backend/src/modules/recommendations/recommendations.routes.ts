import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './recommendations.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', asyncHandler(ctrl.mine));
export default router;
