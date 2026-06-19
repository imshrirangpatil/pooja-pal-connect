import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as ctrl from './search.controller';

const router = Router();
router.get('/', asyncHandler(ctrl.search));
export default router;
