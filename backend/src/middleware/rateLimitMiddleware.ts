import { Request, Response, NextFunction } from 'express';
import { redis, keys } from '../config/redis';
import { Errors } from '../utils/errors';

interface RateLimitOptions {
  bucket: string;            // namespace, e.g. "send-otp"
  windowSeconds: number;     // sliding fixed window length
  max: number;               // max requests per window
  // How to identify the caller. Defaults to IP; pass a custom keyer for phone/user.
  keyBy?: (req: Request) => string;
}

/**
 * Generic Redis fixed-window rate limiter. Configurable per route.
 * Increments RL:{bucket}:{id}; first hit in a window sets the TTL.
 */
export function rateLimitMiddleware(opts: RateLimitOptions) {
  const keyBy = opts.keyBy ?? ((req: Request) => req.ip ?? 'unknown');
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = keyBy(req);
      const redisKey = keys.rateLimit(opts.bucket, id);
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, opts.windowSeconds);
      }
      const ttl = await redis.ttl(redisKey);
      res.setHeader('X-RateLimit-Limit', String(opts.max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, opts.max - count)));
      if (count > opts.max) {
        res.setHeader('Retry-After', String(ttl > 0 ? ttl : opts.windowSeconds));
        return next(Errors.tooManyRequests());
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
