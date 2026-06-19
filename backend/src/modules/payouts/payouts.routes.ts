import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { roleMiddleware } from '../../middleware/roleMiddleware';
import * as ctrl from './payouts.controller';

const router = Router();
router.use(authMiddleware);
// Pandit self-service
router.get('/earnings', roleMiddleware('pandit', 'admin'), asyncHandler(ctrl.earnings));
router.get('/', roleMiddleware('pandit', 'admin'), asyncHandler(ctrl.list));
router.post('/request', roleMiddleware('pandit', 'admin'), asyncHandler(ctrl.request));
// Admin processing
router.put('/:id/process', roleMiddleware('admin'), asyncHandler(ctrl.process));

export default router;
