import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './cart.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', asyncHandler(ctrl.get));
router.post('/items', asyncHandler(ctrl.add));
router.put('/items/:id', asyncHandler(ctrl.update));
router.delete('/items/:id', asyncHandler(ctrl.remove));
router.delete('/', asyncHandler(ctrl.clear));

export default router;
