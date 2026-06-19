import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, Role } from '../utils/jwt';
import { Errors } from '../utils/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

/**
 * Verify the Bearer access token and attach req.user = { id, role }.
 * Rejects with 401 when missing/expired/invalid.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(Errors.unauthorized('Missing Authorization: Bearer <token> header.'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}
