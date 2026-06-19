import { Request, Response, NextFunction } from 'express';
import { Role } from '../utils/jwt';
import { Errors } from '../utils/errors';

/**
 * Restrict a route to one of the given roles. Must run after authMiddleware.
 * Usage: router.get('/admin', authMiddleware, roleMiddleware('admin'), handler)
 */
export function roleMiddleware(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Errors.unauthorized());
    if (!allowed.includes(req.user.role)) return next(Errors.forbidden());
    next();
  };
}
