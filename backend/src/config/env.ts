import dotenv from 'dotenv';
dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`Env var ${name} must be a number`);
  return n;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

export const env = {
  port: num('PORT', 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  databaseUrl: required('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/pranam'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),

  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-only-insecure-secret-change-me'),
  accessTokenTtl: num('ACCESS_TOKEN_TTL', 900),
  refreshTokenTtl: num('REFRESH_TOKEN_TTL', 2592000),

  msg91AuthKey: process.env.MSG91_AUTH_KEY ?? '',
  msg91SenderId: process.env.MSG91_SENDER_ID ?? 'PRANAM',
  msg91TemplateId: process.env.MSG91_OTP_TEMPLATE_ID ?? '',
  smsDryRun: bool('SMS_DRY_RUN', true),

  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',

  fxApiUrl: process.env.FX_API_URL ?? 'https://api.exchangerate.host/latest',
  fxCacheTtl: num('FX_CACHE_TTL', 21600),

  otpTtl: num('OTP_TTL', 600),
  otpMaxRequestsPerHour: num('OTP_MAX_REQUESTS_PER_HOUR', 3),
  otpMaxWrongAttempts: num('OTP_MAX_WRONG_ATTEMPTS', 5),
  otpLockSeconds: num('OTP_LOCK_SECONDS', 1800),
};

export const isProd = env.nodeEnv === 'production';
