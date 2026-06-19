import { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db';
import { generateUniqueReferralCode } from '../../utils/referral';
import { formatINR, formatSignedINR } from '../../utils/response';
import { Errors } from '../../utils/errors';
import { Currency } from '../../utils/currency';
import { Role } from '../../utils/jwt';
import { UserRow, AddressRow, CreditTxRow } from './user.types';

// ── Lookups ──────────────────────────────────────────────
export async function findUserById(id: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}
export async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>('SELECT * FROM users WHERE phone = $1', [phone]);
  return rows[0] ?? null;
}
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}
export async function findUserByGoogleId(googleId: string): Promise<UserRow | null> {
  const { rows } = await query<UserRow>('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return rows[0] ?? null;
}

/** Resolve a referral code to the referrer's user id (or null). */
export async function resolveReferrer(code?: string): Promise<string | null> {
  if (!code) return null;
  const { rows } = await query<{ id: string }>(
    'SELECT id FROM users WHERE referral_code = $1',
    [code],
  );
  return rows[0]?.id ?? null;
}

interface CreateUserParams {
  phone?: string;
  email?: string;
  googleId?: string;
  name?: string;
  photoUrl?: string;
  role?: Role;
  referredBy?: string | null;
}

/** Insert a brand-new user with a unique referral code. */
export async function createUser(params: CreateUserParams): Promise<UserRow> {
  const referralCode = await generateUniqueReferralCode();
  const { rows } = await query<UserRow>(
    `INSERT INTO users (phone, email, google_id, name, photo_url, role, referral_code, referred_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      params.phone ?? null,
      params.email ?? null,
      params.googleId ?? null,
      params.name ?? '',
      params.photoUrl ?? null,
      params.role ?? 'user',
      referralCode,
      params.referredBy ?? null,
    ],
  );
  return rows[0];
}

/** Link a Google identity onto an existing (phone/email) user — account merge. */
export async function attachGoogleIdentity(
  userId: string,
  googleId: string,
  email?: string,
  name?: string,
  photoUrl?: string,
): Promise<UserRow> {
  const { rows } = await query<UserRow>(
    `UPDATE users SET
        google_id = COALESCE(google_id, $2),
        email     = COALESCE(email, $3),
        name      = CASE WHEN name = '' THEN COALESCE($4, name) ELSE name END,
        photo_url = COALESCE(photo_url, $5)
     WHERE id = $1
     RETURNING *`,
    [userId, googleId, email ?? null, name ?? null, photoUrl ?? null],
  );
  return rows[0];
}

// ── Profile updates ──────────────────────────────────────
type ProfileFields = Partial<Pick<UserRow, 'name' | 'email' | 'photo_url' | 'gotra' | 'city'>>;

export async function updateProfile(id: string, fields: ProfileFields): Promise<UserRow> {
  const allowed: (keyof ProfileFields)[] = ['name', 'email', 'photo_url', 'gotra', 'city'];
  const sets: string[] = [];
  const values: any[] = [];
  let i = 1;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      values.push(fields[key]);
    }
  }
  if (sets.length === 0) {
    const u = await findUserById(id);
    if (!u) throw Errors.notFound('User not found.');
    return u;
  }
  values.push(id);
  const { rows } = await query<UserRow>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values,
  );
  if (!rows[0]) throw Errors.notFound('User not found.');
  return rows[0];
}

export async function setFcmToken(id: string, token: string): Promise<void> {
  await query('UPDATE users SET fcm_token = $2 WHERE id = $1', [id, token]);
}

export async function setNriMode(id: string, isNri: boolean, currency?: Currency): Promise<UserRow> {
  // When enabling NRI without a currency, keep the existing preference.
  const { rows } = await query<UserRow>(
    `UPDATE users SET
        is_nri = $2,
        currency = COALESCE($3, currency)
     WHERE id = $1
     RETURNING *`,
    [id, isNri, currency ?? null],
  );
  if (!rows[0]) throw Errors.notFound('User not found.');
  return rows[0];
}

// ── Credits ──────────────────────────────────────────────
export interface AddCreditParams {
  userId: string;
  type: 'earned' | 'redeemed' | 'refunded';
  amount: number; // paise, positive
  source: 'referral' | 'order_refund' | 'promotion';
  referenceId?: string | null;
  description?: string;
}

/**
 * Atomically adjust a user's balance and append a ledger row.
 * 'redeemed' decreases the balance and is rejected if it would go negative.
 * Returns the new balance (paise).
 */
export async function addCreditTransaction(p: AddCreditParams): Promise<number> {
  if (p.amount <= 0) throw Errors.validation('Credit amount must be positive.');
  return withTransaction(async (client: PoolClient) => {
    const lock = await client.query<{ credits_balance: number }>(
      'SELECT credits_balance FROM users WHERE id = $1 FOR UPDATE',
      [p.userId],
    );
    if (!lock.rows[0]) throw Errors.notFound('User not found.');
    const current = lock.rows[0].credits_balance;
    const delta = p.type === 'redeemed' ? -p.amount : p.amount;
    const next = current + delta;
    if (next < 0) throw Errors.insufficientCredits();

    await client.query('UPDATE users SET credits_balance = $2 WHERE id = $1', [p.userId, next]);
    await client.query(
      `INSERT INTO credit_transactions
         (user_id, type, amount, source, reference_id, description, balance_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [p.userId, p.type, p.amount, p.source, p.referenceId ?? null, p.description ?? null, next],
    );
    return next;
  });
}

export async function getCredits(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw Errors.notFound('User not found.');
  const { rows } = await query<CreditTxRow>(
    `SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [userId],
  );
  return {
    balance: user.credits_balance,
    balance_display: formatINR(user.credits_balance),
    transactions: rows.map((t) => ({
      type: t.type,
      amount: t.amount,
      amount_display: formatSignedINR(t.amount, t.type),
      source: t.source,
      description: t.description,
      created_at: t.created_at,
    })),
  };
}

// ── Response shapers ─────────────────────────────────────
export function shapeAuthUser(u: UserRow, isNewUser: boolean) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    photo_url: u.photo_url,
    referral_code: u.referral_code,
    is_new_user: isNewUser,
  };
}

export function shapeAddress(a: AddressRow) {
  return {
    id: a.id,
    label: a.label,
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country,
    is_default: a.is_default,
  };
}

export function shapeMe(u: UserRow, defaultAddress: AddressRow | null) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    photo_url: u.photo_url,
    gotra: u.gotra,
    city: u.city,
    country: u.country,
    is_nri: u.is_nri,
    currency: u.currency,
    credits_balance: u.credits_balance,
    credits_display: formatINR(u.credits_balance),
    referral_code: u.referral_code,
    default_address: defaultAddress ? shapeAddress(defaultAddress) : null,
    created_at: u.created_at,
  };
}
