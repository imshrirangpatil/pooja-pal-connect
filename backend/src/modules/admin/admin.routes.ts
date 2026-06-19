import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { roleMiddleware } from '../../middleware/roleMiddleware';
import * as ctrl from './admin.controller';

const router = Router();
// Every admin route requires an authenticated admin.
router.use(authMiddleware, roleMiddleware('admin'));

router.get('/dashboard', asyncHandler(ctrl.dashboard));
router.get('/users', asyncHandler(ctrl.listUsers));
router.put('/users/:id/role', asyncHandler(ctrl.setUserRole));
router.post('/users/:id/credits', asyncHandler(ctrl.grantCredits));
router.get('/orders', asyncHandler(ctrl.listOrders));

export default router;
