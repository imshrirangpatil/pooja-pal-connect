import crypto from 'crypto';
import { query } from '../../config/db';
import { Errors } from '../../utils/errors';
import { buildRtcToken } from '../../services/agora';

export async function createSession(userId: string, bookingId?: string, panditId?: string) {
  const channel = `pranam_${crypto.randomUUID().slice(0, 12)}`;
  const { rows } = await query(
    `INSERT INTO video_sessions (booking_id, user_id, pandit_id, channel_name, status)
     VALUES ($1,$2,$3,$4,'created') RETURNING *`,
    [bookingId ?? null, userId, panditId ?? null, channel],
  );
  return rows[0];
}

export async function getToken(userId: string, sessionId: string) {
  const { rows } = await query('SELECT * FROM video_sessions WHERE id = $1', [sessionId]);
  if (!rows[0]) throw Errors.notFound('Session not found.');
  return buildRtcToken(rows[0].channel_name, userId);
}

export async function endSession(sessionId: string) {
  const { rows } = await query(
    `UPDATE video_sessions SET status='ended', ended_at=now() WHERE id=$1 RETURNING *`, [sessionId]);
  if (!rows[0]) throw Errors.notFound('Session not found.');
  return rows[0];
}
