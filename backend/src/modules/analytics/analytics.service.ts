import { query } from '../../config/db';

/** Append an analytics event. user_id may be null for anonymous events. */
export async function track(userId: string | null, name: string, props?: Record<string, unknown>) {
  const { rows } = await query(
    `INSERT INTO events (user_id, name, props) VALUES ($1,$2,$3) RETURNING id, name, created_at`,
    [userId, name, props ?? null],
  );
  return rows[0];
}

/** Admin: event counts grouped by name over the last N days. */
export async function summary(days = 7) {
  const { rows } = await query(
    `SELECT name, COUNT(*)::int AS count FROM events
     WHERE created_at >= now() - ($1 || ' days')::interval
     GROUP BY name ORDER BY count DESC`,
    [days],
  );
  return rows;
}
