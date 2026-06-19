import { query } from '../../config/db';
import { addCreditTransaction } from '../users/users.service';

/** High-level dashboard counts for the admin home screen. */
export async function dashboard() {
  const [users, orders, bookings, pandits, revenue] = await Promise.all([
    query<{ c: string }>(`SELECT COUNT(*)::int AS c FROM users`),
    query<{ c: string }>(`SELECT COUNT(*)::int AS c FROM orders`),
    query<{ c: string }>(`SELECT COUNT(*)::int AS c FROM bookings`),
    query<{ c: string }>(`SELECT COUNT(*)::int AS c FROM pandits WHERE is_active = true`),
    query<{ s: string }>(`SELECT COALESCE(SUM(total),0)::bigint AS s FROM orders WHERE status IN ('paid','packed','shipped','delivered')`),
  ]);
  return {
    users: Number(users.rows[0].c),
    orders: Number(orders.rows[0].c),
    bookings: Number(bookings.rows[0].c),
    active_pandits: Number(pandits.rows[0].c),
    gross_revenue_paise: Number(revenue.rows[0].s),
  };
}

export async function listUsers(limit = 50, offset = 0) {
  const { rows } = await query(
    `SELECT id, name, phone, email, role, credits_balance, is_active, created_at
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return rows;
}

export async function listAllOrders(limit = 50, offset = 0) {
  const { rows } = await query(
    `SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return rows;
}

export async function setUserRole(userId: string, role: 'user' | 'pandit' | 'admin') {
  const { rows } = await query('UPDATE users SET role = $2 WHERE id = $1 RETURNING id, role', [userId, role]);
  return rows[0];
}

/** Manually grant promotional credits to a user. */
export async function grantCredits(userId: string, amount: number, description?: string) {
  const balance = await addCreditTransaction({
    userId, type: 'earned', amount, source: 'promotion', description: description ?? 'Admin credit grant',
  });
  return { balance };
}
