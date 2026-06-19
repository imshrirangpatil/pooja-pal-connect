import { Request, Response } from 'express';
import { Errors } from '../../utils/errors';
import {
  updateProfileSchema,
  fcmTokenSchema,
  nriModeSchema,
  addressSchema,
} from '../../utils/validators';
import { Currency } from '../../utils/currency';
import * as users from './users.service';
import * as addresses from './addresses.service';

// ── Profile ──────────────────────────────────────────────
export async function getMe(req: Request, res: Response) {
  const user = await users.findUserById(req.user!.id);
  if (!user) throw Errors.notFound('User not found.');
  const def = await addresses.getDefaultAddress(user.id);
  res.json(users.shapeMe(user, def));
}

export async function updateMe(req: Request, res: Response) {
  const fields = updateProfileSchema.parse(req.body);
  const updated = await users.updateProfile(req.user!.id, fields);
  const def = await addresses.getDefaultAddress(updated.id);
  res.json(users.shapeMe(updated, def));
}

export async function updateFcmToken(req: Request, res: Response) {
  const { fcm_token } = fcmTokenSchema.parse(req.body);
  await users.setFcmToken(req.user!.id, fcm_token);
  res.json({ message: 'FCM token updated' });
}

export async function updateNriMode(req: Request, res: Response) {
  const { is_nri, currency } = nriModeSchema.parse(req.body);
  const updated = await users.setNriMode(req.user!.id, is_nri, currency as Currency | undefined);
  res.json({
    is_nri: updated.is_nri,
    currency: updated.currency,
    message: 'NRI preferences updated',
  });
}

// ── Addresses ────────────────────────────────────────────
export async function listAddresses(req: Request, res: Response) {
  const rows = await addresses.listAddresses(req.user!.id);
  res.json({ addresses: rows.map(users.shapeAddress), total: rows.length });
}

export async function createAddress(req: Request, res: Response) {
  const input = addressSchema.parse(req.body);
  const row = await addresses.createAddress(req.user!.id, input);
  res.status(201).json(users.shapeAddress(row));
}

export async function updateAddress(req: Request, res: Response) {
  const input = addressSchema.parse(req.body);
  const row = await addresses.updateAddress(req.user!.id, req.params.id, input);
  res.json(users.shapeAddress(row));
}

export async function deleteAddress(req: Request, res: Response) {
  await addresses.deleteAddress(req.user!.id, req.params.id);
  res.json({ message: 'Address deleted' });
}

export async function setDefaultAddress(req: Request, res: Response) {
  const row = await addresses.setDefaultAddress(req.user!.id, req.params.id);
  res.json(users.shapeAddress(row));
}

// ── Credits ──────────────────────────────────────────────
export async function getCredits(req: Request, res: Response) {
  const result = await users.getCredits(req.user!.id);
  res.json(result);
}
