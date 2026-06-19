import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Errors } from './errors';

export type Role = 'user' | 'pandit' | 'admin';

export interface AccessTokenPayload {
  userId: string;
  role: Role;
}

/** Sign a short-lived access token (default 15 min). */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
    issuer: 'pranam',
  });
}

/** Verify an access token; throws AppError on failure. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret, { issuer: 'pranam' }) as
      | (AccessTokenPayload & jwt.JwtPayload)
      | string;
    if (typeof decoded === 'string' || !decoded.userId || !decoded.role) {
      throw Errors.invalidToken();
    }
    return { userId: decoded.userId, role: decoded.role };
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') throw Errors.tokenExpired();
    if (err instanceof Error && err.name === 'AppError') throw err;
    throw Errors.invalidToken();
  }
}
