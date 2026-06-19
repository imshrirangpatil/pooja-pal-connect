import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from './currency';

// E.164-ish: leading +, country code, 6–14 more digits. Covers +91XXXXXXXXXX and intl.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in international format, e.g. +919876543210');

// Name: letters, spaces, dot and apostrophe only; 2–100 chars.
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters')
  .regex(/^[A-Za-z][A-Za-z .']*$/, 'Name may only contain letters, spaces, . and \'');

export const emailSchema = z.string().trim().email('Invalid email address').max(255);

export const gotraSchema = z
  .string()
  .trim()
  .max(100)
  .regex(/^[A-Za-z ]*$/, 'Gotra may only contain letters');

export const currencySchema = z.enum(SUPPORTED_CURRENCIES as [string, ...string[]]);

// ── Auth ─────────────────────────────────────────────────
export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  referral_code: z.string().trim().max(20).optional(),
});

export const googleSchema = z.object({
  id_token: z.string().min(10, 'id_token is required'),
  referral_code: z.string().trim().max(20).optional(),
});

export const refreshSchema = z.object({
  // Mobile clients may send the refresh token in the body; web uses an httpOnly cookie.
  refresh_token: z.string().uuid().optional(),
});

// ── Users ────────────────────────────────────────────────
export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    photo_url: z.string().url().max(2048).optional(),
    gotra: gotraSchema.optional(),
    city: z.string().trim().max(100).optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' });

export const fcmTokenSchema = z.object({
  fcm_token: z.string().min(1).max(4096),
});

export const nriModeSchema = z.object({
  is_nri: z.boolean(),
  currency: currencySchema.optional(),
});

function pincodeForCountry(country: string | undefined) {
  const isIndia = !country || /^(in|india)$/i.test(country);
  return z
    .string()
    .trim()
    .refine(
      (v) => (isIndia ? /^\d{6}$/.test(v) : /^[A-Za-z0-9 -]{3,12}$/.test(v)),
      isIndia ? 'Indian pincode must be 6 digits' : 'Invalid postal code',
    );
}

export const addressSchema = z
  .object({
    label: z.string().trim().max(50).default('Home'),
    name: nameSchema,
    phone: phoneSchema,
    line1: z.string().trim().min(1).max(500),
    line2: z.string().trim().max(500).optional(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    pincode: z.string().trim().min(3).max(10),
    country: z.string().trim().max(100).default('India'),
    is_default: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const res = pincodeForCountry(val.country).safeParse(val.pincode);
    if (!res.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pincode'], message: res.error.issues[0].message });
    }
  });

export const addressUpdateSchema = addressSchema; // same field rules; controller treats all as replace

export type AddressInput = z.infer<typeof addressSchema>;
