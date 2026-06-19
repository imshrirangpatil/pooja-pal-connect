import { query } from '../../config/db';
import { Errors } from '../../utils/errors';

/**
 * Pandit earnings = sum of completed bookings' amounts minus payouts already
 * requested/paid. (Simplified v1 model; refine when the Booking->Payment link
 * and commission rules are finalised.)
 */
export async function earnings(panditId: string) {
  const earned = await query<{ s: string }>(
    `SELECT COALESCE(SUM(amount),0)::bigint AS s FROM bookings WHERE pandit_id = $1 AND status = 'completed'`, [panditId]);
  const paidOut = await query<{ s: string }>(
    `SELECT COALESCE(SUM(amount),0)::bigint AS s FROM payouts WHERE pandit_id = $1 AND status IN ('requested','processing','paid')`, [panditId]);
  const total = Number(earned.rows[0].s);
  const reserved = Number(paidOut.rows[0].s);
  return { total_earned_paise: total, paid_or_pending_paise: reserved, available_paise: Math.max(0, total - reserved) };
}

export async function requestPayout(panditId: string, amount: number) {
  const { available_paise } = await earnings(panditId);
  if (amount > available_paise) throw Errors.validation('Requested amount exceeds available balance.');
  const { rows } = await query(
    `INSERT INTO payouts (pandit_id, amount, status) VALUES ($1,$2,'requested') RETURNING *`, [panditId, amount]);
  return rows[0];
}

export async function listPayouts(panditId: string) {
  const { rows } = await query('SELECT * FROM payouts WHERE pandit_id = $1 ORDER BY created_at DESC', [panditId]);
  return rows;
}

// Admin
export async function processPayout(id: string, status: 'processing' | 'paid' | 'rejected', reference?: string) {
  const { rows } = await query('UPDATE payouts SET status=$2, reference=COALESCE($3,reference) WHERE id=$1 RETURNING *', [id, status, reference ?? null]);
  if (!rows[0]) throw Errors.notFound('Payout not found.');
  return rows[0];
}

/** Resolve the pandit row owned by a user (for pandit-role self-service). */
export async function panditIdForUser(userId: string): Promise<string> {
  const { rows } = await query<{ id: string }>('SELECT id FROM pandits WHERE user_id = $1', [userId]);
  if (!rows[0]) throw Errors.forbidden('No pandit profile linked to this account.');
  return rows[0].id;
}
