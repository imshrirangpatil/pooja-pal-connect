import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/authMiddleware';
import { roleMiddleware } from '../../middleware/roleMiddleware';
import * as ctrl from './analytics.controller';

const router = Router();
// Ingest is open (optionally authed — user attached if a token is present is omitted for simplicity).
router.post('/events', asyncHandler(ctrl.track));
router.get('/summary', authMiddleware, roleMiddleware('admin'), asyncHandler(ctrl.summary));

export default router;
