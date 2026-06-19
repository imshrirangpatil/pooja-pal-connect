import { query } from '../../config/db';
import { Errors } from '../../utils/errors';

export interface PanditFilter {
  city?: string;
  specialization?: string;
  language?: string;
  limit: number;
  offset: number;
}

export async function listPandits(f: PanditFilter) {
  const where: string[] = ['is_active = true'];
  const params: any[] = [];
  let i = 1;
  if (f.city) { where.push(`city ILIKE $${i++}`); params.push(f.city); }
  if (f.specialization) { where.push(`$${i++} = ANY(specializations)`); params.push(f.specialization); }
  if (f.language) { where.push(`$${i++} = ANY(languages)`); params.push(f.language); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  params.push(f.limit, f.offset);
  const { rows } = await query(
    `SELECT id, name, bio, photo_url, city, languages, specializations,
            experience_yrs, rating_avg, rating_count, is_verified
     FROM pandits ${whereSql} ORDER BY rating_avg DESC, experience_yrs DESC
     LIMIT $${i++} OFFSET $${i++}`,
    params,
  );
  const c = await query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM pandits ${whereSql}`, params.slice(0, params.length - 2));
  return { pandits: rows, total: Number(c.rows[0]?.count ?? 0) };
}

export async function getPandit(id: string) {
  const { rows } = await query(`SELECT * FROM pandits WHERE id = $1 AND is_active = true`, [id]);
  if (!rows[0]) throw Errors.notFound('Pandit not found.');
  return rows[0];
}

export async function getAvailability(panditId: string, from?: string, to?: string) {
  const params: any[] = [panditId];
  let extra = '';
  let i = 2;
  if (from) { extra += ` AND slot_start >= $${i++}`; params.push(from); }
  if (to) { extra += ` AND slot_start <= $${i++}`; params.push(to); }
  const { rows } = await query(
    `SELECT id, slot_start, slot_end, is_booked FROM pandit_availability
     WHERE pandit_id = $1 AND is_booked = false${extra}
     ORDER BY slot_start LIMIT 200`,
    params,
  );
  return rows;
}

// Admin / pandit-owner
export async function upsertPandit(data: any) {
  const { rows } = await query(
    `INSERT INTO pandits (id, user_id, name, bio, photo_url, city, languages, specializations, experience_yrs, is_verified)
     VALUES (COALESCE($1, gen_random_uuid()), $2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, bio=EXCLUDED.bio, photo_url=EXCLUDED.photo_url,
       city=EXCLUDED.city, languages=EXCLUDED.languages, specializations=EXCLUDED.specializations,
       experience_yrs=EXCLUDED.experience_yrs, is_verified=EXCLUDED.is_verified
     RETURNING *`,
    [data.id ?? null, data.user_id ?? null, data.name, data.bio ?? null, data.photo_url ?? null,
     data.city ?? null, data.languages ?? [], data.specializations ?? [], data.experience_yrs ?? 0, data.is_verified ?? false],
  );
  return rows[0];
}

export async function addAvailability(panditId: string, slots: { slot_start: string; slot_end: string }[]) {
  const created: any[] = [];
  for (const s of slots) {
    const { rows } = await query(
      `INSERT INTO pandit_availability (pandit_id, slot_start, slot_end)
       VALUES ($1,$2,$3) ON CONFLICT (pandit_id, slot_start) DO NOTHING RETURNING *`,
      [panditId, s.slot_start, s.slot_end],
    );
    if (rows[0]) created.push(rows[0]);
  }
  return created;
}
