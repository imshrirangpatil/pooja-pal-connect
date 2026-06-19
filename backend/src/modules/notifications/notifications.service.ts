import { query } from '../../config/db';
import { Errors } from '../../utils/errors';
import { sendPush, sendEmail } from '../../services/push';

interface NotifyInput {
  userId: string;
  title: string;
  body?: string;
  channel?: 'in_app' | 'push' | 'sms' | 'email';
  data?: Record<string, unknown>;
}

/** Create an in-app notification row and fan out to the requested channel. */
export async function notify(input: NotifyInput) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, channel, title, body, data)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [input.userId, input.channel ?? 'in_app', input.title, input.body ?? null, input.data ?? null],
  );
  if (input.channel === 'push' || input.channel === 'email') {
    const u = await query<{ fcm_token: string | null; email: string | null }>(
      'SELECT fcm_token, email FROM users WHERE id = $1', [input.userId]);
    if (input.channel === 'push') await sendPush(u.rows[0]?.fcm_token ?? null, input.title, input.body ?? '');
    if (input.channel === 'email') await sendEmail(u.rows[0]?.email ?? null, input.title, input.body ?? '');
  }
  return rows[0];
}

export async function list(userId: string, unreadOnly = false) {
  const { rows } = await query(
    `SELECT id, channel, title, body, data, is_read, created_at FROM notifications
     WHERE user_id = $1 ${unreadOnly ? 'AND is_read = false' : ''}
     ORDER BY created_at DESC LIMIT 100`,
    [userId],
  );
  return rows;
}

export async function markRead(userId: string, id: string) {
  const { rowCount } = await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!rowCount) throw Errors.notFound('Notification not found.');
}

export async function markAllRead(userId: string) {
  await query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [userId]);
}
