import { v4 as uuidv4 } from 'uuid';
import { redis, keys } from '../config/redis';
import { env } from '../config/env';

/**
 * Refresh tokens are opaque UUIDs (NOT JWTs).
 *  - SESSION:{userId} is a SET of the user's active refresh tokens
 *    (so the same account can stay logged in on multiple devices).
 *  - REFRESH:{token} -> userId is a reverse index so the /auth/refresh
 *    endpoint can identify the user from the token alone.
 *  - BLACKLIST:{token} blocks a rotated/revoked token until natural expiry.
 * All keys are refreshed to REFRESH_TOKEN_TTL on issue/rotate.
 */

function refreshIndexKey(token: string) {
  return `REFRESH:${token}`;
}

/** Create a new refresh token and register it for the user. */
export async function issueRefreshToken(userId: string): Promise<string> {
  const refreshToken = uuidv4();
  const sessionKey = keys.session(userId);
  const pipe = redis.pipeline();
  pipe.sadd(sessionKey, refreshToken);
  pipe.expire(sessionKey, env.refreshTokenTtl);
  pipe.set(refreshIndexKey(refreshToken), userId, 'EX', env.refreshTokenTtl);
  await pipe.exec();
  return refreshToken;
}

/** Look up which user a refresh token belongs to (or null). */
export async function userIdForRefreshToken(refreshToken: string): Promise<string | null> {
  return redis.get(refreshIndexKey(refreshToken));
}

/** True if the refresh token is an active session member and not blacklisted. */
export async function isRefreshTokenValid(userId: string, refreshToken: string): Promise<boolean> {
  const blacklisted = await redis.exists(keys.blacklist(refreshToken));
  if (blacklisted) return false;
  const member = await redis.sismember(keys.session(userId), refreshToken);
  return member === 1;
}

/** Rotate: revoke the old token and issue a fresh one. */
export async function rotateRefreshToken(userId: string, oldToken: string): Promise<string> {
  await revokeRefreshToken(userId, oldToken);
  return issueRefreshToken(userId);
}

/** Revoke a single refresh token (logout on one device). */
export async function revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const pipe = redis.pipeline();
  pipe.srem(keys.session(userId), refreshToken);
  pipe.del(refreshIndexKey(refreshToken));
  pipe.set(keys.blacklist(refreshToken), '1', 'EX', env.refreshTokenTtl);
  await pipe.exec();
}

/** Revoke every session for a user (logout everywhere). */
export async function revokeAllSessions(userId: string): Promise<void> {
  const sessionKey = keys.session(userId);
  const tokens = await redis.smembers(sessionKey);
  const pipe = redis.pipeline();
  for (const t of tokens) {
    pipe.set(keys.blacklist(t), '1', 'EX', env.refreshTokenTtl);
    pipe.del(refreshIndexKey(t));
  }
  pipe.del(sessionKey);
  await pipe.exec();
}
