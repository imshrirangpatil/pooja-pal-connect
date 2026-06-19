import { query } from '../../config/db';
import { Errors } from '../../utils/errors';

export async function listPlans() {
  const { rows } = await query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price');
  return rows;
}

export async function subscribe(userId: string, planId: string) {
  const plan = await query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [planId]);
  if (!plan.rows[0]) throw Errors.notFound('Plan not found.');
  const interval = plan.rows[0].interval as string;
  const months = interval === 'yearly' ? 12 : interval === 'quarterly' ? 3 : 1;
  const { rows } = await query(
    `INSERT INTO subscriptions (user_id, plan_id, status, expires_at)
     VALUES ($1,$2,'active', now() + ($3 || ' months')::interval) RETURNING *`,
    [userId, planId, months],
  );
  return rows[0];
}

export async function mySubscription(userId: string) {
  const { rows } = await query(
    `SELECT s.*, p.name AS plan_name, p.interval FROM subscriptions s
     JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.user_id = $1 AND s.status = 'active' ORDER BY s.created_at DESC LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function cancel(userId: string, id: string) {
  const { rows } = await query(
    `UPDATE subscriptions SET status='cancelled' WHERE id=$1 AND user_id=$2 RETURNING *`, [id, userId]);
  if (!rows[0]) throw Errors.notFound('Subscription not found.');
  return rows[0];
}
