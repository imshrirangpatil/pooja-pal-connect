import { withTransaction, query } from '../../config/db';
import { Errors } from '../../utils/errors';

/** Create/replace a user's review for a target, and refresh pandit rating aggregates. */
export async function upsertReview(userId: string, targetType: 'pandit' | 'pooja', targetId: string, rating: number, comment?: string) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO reviews (user_id, target_type, target_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, target_type, target_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
       RETURNING *`,
      [userId, targetType, targetId, rating, comment ?? null],
    );
    if (targetType === 'pandit') {
      const agg = await client.query<{ avg: string; cnt: string }>(
        `SELECT COALESCE(AVG(rating),0) AS avg, COUNT(*) AS cnt FROM reviews WHERE target_type='pandit' AND target_id=$1`,
        [targetId],
      );
      await client.query('UPDATE pandits SET rating_avg = $2, rating_count = $3 WHERE id = $1',
        [targetId, Number(agg.rows[0].avg).toFixed(2), Number(agg.rows[0].cnt)]);
    }
    return rows[0];
  });
}

export async function listForTarget(targetType: string, targetId: string) {
  const { rows } = await query(
    `SELECT r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.target_type = $1 AND r.target_id = $2 ORDER BY r.created_at DESC LIMIT 100`,
    [targetType, targetId],
  );
  return rows;
}
