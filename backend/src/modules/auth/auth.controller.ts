import { Request, Response } from 'express';
import { isProd } from '../../config/env';
import { env } from '../../config/env';
import {
  sendOtpSchema,
  verifyOtpSchema,
  googleSchema,
  refreshSchema,
} from '../../utils/validators';
import { Errors } from '../../utils/errors';
import { findUserById, shapeMe } from '../users/users.service';
import { getDefaultAddress } from '../users/addresses.service';
import * as authService from './auth.service';

const REFRESH_COOKIE = 'refresh_token';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: env.refreshTokenTtl * 1000,
    path: '/auth',
  });
}

/** Refresh token arrives in an httpOnly cookie (web) or the request body (mobile). */
function readRefreshToken(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE] ?? req.body?.refresh_token;
}

export async function sendOtp(req: Request, res: Response) {
  const { phone } = sendOtpSchema.parse(req.body);
  const result = await authService.sendOtp(phone);
  res.json(result);
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, otp, referral_code } = verifyOtpSchema.parse(req.body);
  const result = await authService.verifyOtp(phone, otp, referral_code);
  setRefreshCookie(res, result.refresh_token);
  res.json(result);
}

export async function google(req: Request, res: Response) {
  const { id_token, referral_code } = googleSchema.parse(req.body);
  const result = await authService.googleLogin(id_token, referral_code);
  setRefreshCookie(res, result.refresh_token);
  res.json(result);
}

export async function refresh(req: Request, res: Response) {
  refreshSchema.parse(req.body ?? {});
  const token = readRefreshToken(req);
  if (!token) throw Errors.invalidToken('No refresh token provided.');
  const result = await authService.refresh(token);
  setRefreshCookie(res, result.refresh_token);
  res.json(result);
}

export async function logout(req: Request, res: Response) {
  const token = readRefreshToken(req);
  await authService.logout(req.user!.id, token);
  res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
  const user = await findUserById(req.user!.id);
  if (!user) throw Errors.notFound('User not found.');
  const def = await getDefaultAddress(user.id);
  res.json(shapeMe(user, def));
}
