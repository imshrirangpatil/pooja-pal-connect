import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as ctrl from './users.controller';

const router = Router();

// Every /users route requires a valid access token.
router.use(authMiddleware);

router.get('/me', asyncHandler(ctrl.getMe));
router.put('/me', asyncHandler(ctrl.updateMe));
router.put('/me/fcm-token', asyncHandler(ctrl.updateFcmToken));
router.put('/me/nri-mode', asyncHandler(ctrl.updateNriMode));

router.get('/me/addresses', asyncHandler(ctrl.listAddresses));
router.post('/me/addresses', asyncHandler(ctrl.createAddress));
router.put('/me/addresses/:id', asyncHandler(ctrl.updateAddress));
router.delete('/me/addresses/:id', asyncHandler(ctrl.deleteAddress));
router.put('/me/addresses/:id/default', asyncHandler(ctrl.setDefaultAddress));

router.get('/me/credits', asyncHandler(ctrl.getCredits));

export default router;
