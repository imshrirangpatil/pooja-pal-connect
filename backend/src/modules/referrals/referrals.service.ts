import { withTransaction, query } from '../../config/db';
import { Errors } from '../../utils/errors';

const DEFAULT_REWARD = 10000; // ₹100 in paise

/**
 * Apply a referral code for a referee (the new/invited user). Records the
 * referral and rewards the referrer's credits ledger. A referee can only be
 * referred once (UNIQUE on referee_id).
 */
export async function applyReferral(refereeId: string, code: string) {
  return withTransaction(async (client) => {
    const referrer = await client.query<{ id: string }>('SELECT id FROM users WHERE referral_code = $1', [code]);
    if (!referrer.rows[0]) throw Errors.notFound('Invalid referral code.');
    if (referrer.rows[0].id === refereeId) throw Errors.validation('You cannot refer yourself.');

    const existing = await client.query('SELECT 1 FROM referrals WHERE referee_id = $1', [refereeId]);
    if (existing.rows[0]) throw Errors.validation('A referral has already been applied to this account.');

    const ref = await client.query(
      `INSERT INTO referrals (referrer_id, referee_id, code, reward_paise, status)
       VALUES ($1,$2,$3,$4,'rewarded') RETURNING *`,
      [referrer.rows[0].id, refereeId, code, DEFAULT_REWARD],
    );
    await client.query('UPDATE users SET referred_by = $2 WHERE id = $1 AND referred_by IS NULL', [refereeId, referrer.rows[0].id]);

    // Reward the referrer's credits (inline ledger write within the txn).
    const cur = await client.query<{ credits_balance: number }>('SELECT credits_balance FROM users WHERE id = $1 FOR UPDATE', [referrer.rows[0].id]);
    const next = cur.rows[0].credits_balance + DEFAULT_REWARD;
    await client.query('UPDATE users SET credits_balance = $2 WHERE id = $1', [referrer.rows[0].id, next]);
    await client.query(
      `INSERT INTO credit_transactions (user_id, type, amount, source, reference_id, description, balance_after)
       VALUES ($1,'earned',$2,'referral',$3,$4,$5)`,
      [referrer.rows[0].id, DEFAULT_REWARD, ref.rows[0].id, 'Referral bonus', next],
    );
    return ref.rows[0];
  });
}

export async function myReferrals(userId: string) {
  const { rows } = await query(
    `SELECT r.id, r.code, r.reward_paise, r.status, r.created_at, u.name AS referee_name
     FROM referrals r JOIN users u ON u.id = r.referee_id
     WHERE r.referrer_id = $1 ORDER BY r.created_at DESC`,
    [userId],
  );
  const total = rows.reduce((s, r) => s + (r.status === 'rewarded' ? r.reward_paise : 0), 0);
  return { referrals: rows, total_earned_paise: total };
}
