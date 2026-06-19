import { query, withTransaction } from '../../config/db';
import { Errors } from '../../utils/errors';

export async function startSession(userId: string, astrologerId: string, astrologerName: string, pricePerMin: number) {
  const { rows } = await query(
    `INSERT INTO astro_sessions (user_id, astrologer_id, astrologer_name, price_per_min, status)
     VALUES ($1,$2,$3,$4,'active') RETURNING *`,
    [userId, astrologerId, astrologerName, pricePerMin],
  );
  return rows[0];
}

async function assertOwnsActive(client: any, userId: string, sessionId: string) {
  const s = await client.query('SELECT * FROM astro_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE', [sessionId, userId]);
  if (!s.rows[0]) throw Errors.notFound('Session not found.');
  return s.rows[0];
}

export async function postMessage(userId: string, sessionId: string, sender: string, body: string) {
  return withTransaction(async (client) => {
    const s = await assertOwnsActive(client, userId, sessionId);
    if (s.status !== 'active') throw Errors.validation('Session has ended.');
    const { rows } = await client.query(
      `INSERT INTO astro_messages (session_id, sender, body) VALUES ($1,$2,$3) RETURNING *`,
      [sessionId, sender, body],
    );
    return rows[0];
  });
}

export async function getMessages(userId: string, sessionId: string) {
  const owns = await query('SELECT 1 FROM astro_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
  if (!owns.rows[0]) throw Errors.notFound('Session not found.');
  const { rows } = await query('SELECT sender, body, created_at FROM astro_messages WHERE session_id = $1 ORDER BY created_at', [sessionId]);
  return rows;
}

export async function endSession(userId: string, sessionId: string, secondsElapsed: number) {
  return withTransaction(async (client) => {
    const s = await assertOwnsActive(client, userId, sessionId);
    const billed = Math.ceil(secondsElapsed / 60) * s.price_per_min;
    const { rows } = await client.query(
      `UPDATE astro_sessions SET status='ended', ended_at=now(), seconds_elapsed=$2, billed_amount=$3
       WHERE id=$1 RETURNING *`,
      [sessionId, secondsElapsed, billed],
    );
    return rows[0];
  });
}
