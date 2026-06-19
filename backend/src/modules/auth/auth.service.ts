import { redis, keys } from '../../config/redis';
import { env } from '../../config/env';
import { generateOtp } from '../../utils/otp';
import { signAccessToken } from '../../utils/jwt';
import {
  issueRefreshToken,
  isRefreshTokenValid,
  rotateRefreshToken,
  revokeRefreshToken,
  userIdForRefreshToken,
} from '../../utils/tokens';
import { Errors } from '../../utils/errors';
import { sendOtpSms } from '../../services/sms';
import { verifyGoogleIdToken } from '../../services/google';
import {
  findUserByPhone,
  findUserByGoogleId,
  findUserByEmail,
  createUser,
  findUserById,
  attachGoogleIdentity,
  resolveReferrer,
  shapeAuthUser,
} from '../users/users.service';
import { UserRow } from '../users/user.types';

interface TokenBundle {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function issueTokens(user: UserRow): Promise<TokenBundle> {
  const access_token = signAccessToken({ userId: user.id, role: user.role });
  const refresh_token = await issueRefreshToken(user.id);
  return { access_token, refresh_token, expires_in: env.accessTokenTtl };
}

// ── Send OTP ─────────────────────────────────────────────
export async function sendOtp(phone: string): Promise<{ message: string; expires_in: number }> {
  // Locked out from too many wrong attempts?
  const lockTtl = await redis.ttl(keys.otpLock(phone));
  if (lockTtl > 0) throw Errors.userBlocked(Math.ceil(lockTtl / 60));

  // Max N OTP requests per phone per hour.
  const reqKey = keys.otpRequests(phone);
  const count = await redis.incr(reqKey);
  if (count === 1) await redis.expire(reqKey, 3600);
  if (count > env.otpMaxRequestsPerHour) throw Errors.tooManyRequests();

  const otp = generateOtp();
  await redis.set(keys.otp(phone), otp, 'EX', env.otpTtl);
  await redis.del(keys.otpAttempts(phone)); // reset wrong-attempt counter for the new OTP
  await sendOtpSms(phone, otp);

  return { message: 'OTP sent', expires_in: env.otpTtl };
}

// ── Verify OTP ───────────────────────────────────────────
export async function verifyOtp(phone: string, otp: string, referralCode?: string) {
  const lockTtl = await redis.ttl(keys.otpLock(phone));
  if (lockTtl > 0) throw Errors.userBlocked(Math.ceil(lockTtl / 60));

  const stored = await redis.get(keys.otp(phone));
  if (!stored) throw Errors.otpExpired();

  if (stored !== otp) {
    const attempts = await redis.incr(keys.otpAttempts(phone));
    if (attempts === 1) await redis.expire(keys.otpAttempts(phone), env.otpTtl);
    if (attempts >= env.otpMaxWrongAttempts) {
      // Lock the phone and clear the OTP so it cannot be brute-forced further.
      await redis.set(keys.otpLock(phone), '1', 'EX', env.otpLockSeconds);
      await redis.del(keys.otp(phone));
      await redis.del(keys.otpAttempts(phone));
      throw Errors.tooManyAttempts();
    }
    throw Errors.otpInvalid();
  }

  // Correct OTP — consume it.
  await redis.del(keys.otp(phone));
  await redis.del(keys.otpAttempts(phone));

  let user = await findUserByPhone(phone);
  let isNewUser = false;
  if (!user) {
    const referredBy = await resolveReferrer(referralCode);
    user = await createUser({ phone, referredBy });
    isNewUser = true;
  }

  const tokens = await issueTokens(user);
  return { user: shapeAuthUser(user, isNewUser), ...tokens };
}

// ── Google OAuth ─────────────────────────────────────────
export async function googleLogin(idToken: string, referralCode?: string) {
  const profile = await verifyGoogleIdToken(idToken);

  let user = await findUserByGoogleId(profile.googleId);
  let isNewUser = false;

  if (!user && profile.email) {
    // Account merge: an existing phone/email account with the same email.
    const byEmail = await findUserByEmail(profile.email);
    if (byEmail) {
      user = await attachGoogleIdentity(
        byEmail.id,
        profile.googleId,
        profile.email,
        profile.name,
        profile.picture,
      );
    }
  }

  if (!user) {
    const referredBy = await resolveReferrer(referralCode);
    user = await createUser({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      photoUrl: profile.picture,
      referredBy,
    });
    isNewUser = true;
  }

  const tokens = await issueTokens(user);
  return { user: shapeAuthUser(user, isNewUser), ...tokens };
}

// ── Refresh (rotation) ───────────────────────────────────
export async function refresh(refreshToken: string) {
  const userId = await userIdForRefreshToken(refreshToken);
  if (!userId) throw Errors.invalidToken('Refresh token is invalid or expired. Please log in again.');

  const valid = await isRefreshTokenValid(userId, refreshToken);
  if (!valid) throw Errors.invalidToken('Refresh token is invalid or expired. Please log in again.');

  const user = await findUserById(userId);
  if (!user || !user.is_active) throw Errors.invalidToken('Account is no longer active.');

  const newRefresh = await rotateRefreshToken(userId, refreshToken);
  const access_token = signAccessToken({ userId: user.id, role: user.role });
  return { access_token, refresh_token: newRefresh, expires_in: env.accessTokenTtl };
}

// ── Logout ───────────────────────────────────────────────
export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await revokeRefreshToken(userId, refreshToken);
  }
}
