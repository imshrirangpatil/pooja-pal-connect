import { query } from '../../config/db';

/**
 * Unified search across poojas and pandits using PostgreSQL full-text / ILIKE.
 * NOTE: Phase 3 spec calls for Elasticsearch. This Postgres implementation is
 * the drop-in fallback; swap the queries for an ES client when that lands.
 */
export async function search(q: string, limit = 20) {
  const like = `%${q}%`;
  const poojas = await query(
    `SELECT id, slug, title, base_price, image_url, 'pooja' AS type
     FROM poojas
     WHERE is_active = true AND (search_tsv @@ plainto_tsquery('simple', $1) OR title ILIKE $2)
     LIMIT $3`,
    [q, like, limit],
  );
  const pandits = await query(
    `SELECT id, name AS title, photo_url, city, 'pandit' AS type
     FROM pandits
     WHERE is_active = true AND (name ILIKE $1 OR $2 = ANY(specializations))
     LIMIT $3`,
    [like, q, limit],
  );
  return { poojas: poojas.rows, pandits: pandits.rows };
}
