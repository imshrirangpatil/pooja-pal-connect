import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on('error', (err) => {
  console.error('[redis] connection error', err.message);
});

// ── Key builders — single source of truth for Redis key names ──
export const keys = {
  otp: (phone: string) => `OTP:${phone}`,
  otpAttempts: (phone: string) => `OTP_ATTEMPTS:${phone}`,
  otpRequests: (phone: string) => `OTP_REQUESTS:${phone}`,
  otpLock: (phone: string) => `OTP_LOCK:${phone}`,
  // SESSION:{userId} is a SET of valid refresh tokens (supports multi-device login)
  session: (userId: string) => `SESSION:${userId}`,
  blacklist: (refreshToken: string) => `BLACKLIST:${refreshToken}`,
  rateLimit: (bucket: string, id: string) => `RL:${bucket}:${id}`,
  fxRates: () => `FX_RATES`,
};
