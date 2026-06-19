import { query } from '../../config/db';

/**
 * Simple content/popularity recommendations:
 *  - If the user has past bookings, suggest other poojas in the same categories.
 *  - Otherwise fall back to most-booked poojas.
 * Swap for the dedicated Recommendation Engine module later.
 */
export async function forUser(userId: string, limit = 10) {
  const hist = await query(
    `SELECT DISTINCT p.category_id FROM bookings b
     JOIN poojas p ON p.id = b.pooja_id WHERE b.user_id = $1 AND p.category_id IS NOT NULL`,
    [userId],
  );
  if (hist.rows.length > 0) {
    const cats = hist.rows.map((r) => r.category_id);
    const { rows } = await query(
      `SELECT id, slug, title, base_price, image_url FROM poojas
       WHERE is_active = true AND category_id = ANY($1)
       ORDER BY created_at DESC LIMIT $2`,
      [cats, limit],
    );
    if (rows.length) return { source: 'history', poojas: rows };
  }
  const popular = await query(
    `SELECT p.id, p.slug, p.title, p.base_price, p.image_url, COUNT(b.id)::int AS bookings
     FROM poojas p LEFT JOIN bookings b ON b.pooja_id = p.id
     WHERE p.is_active = true GROUP BY p.id ORDER BY bookings DESC, p.title LIMIT $1`,
    [limit],
  );
  return { source: 'popular', poojas: popular.rows };
}
