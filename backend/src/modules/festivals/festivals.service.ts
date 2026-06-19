import { query } from '../../config/db';

export async function upcomingFestivals(limit = 30) {
  const { rows } = await query(
    `SELECT id, name, date, description FROM festivals WHERE date >= CURRENT_DATE ORDER BY date LIMIT $1`, [limit]);
  return rows;
}
export async function upcomingMuhurats(limit = 30) {
  const { rows } = await query(
    `SELECT id, name, starts_at, ends_at, kind FROM muhurats WHERE ends_at >= now() ORDER BY starts_at LIMIT $1`, [limit]);
  return rows;
}
// Admin
export async function addFestival(name: string, date: string, description?: string) {
  const { rows } = await query(
    `INSERT INTO festivals (name, date, description) VALUES ($1,$2,$3) RETURNING *`, [name, date, description ?? null]);
  return rows[0];
}
export async function addMuhurat(name: string, startsAt: string, endsAt: string, kind?: string) {
  const { rows } = await query(
    `INSERT INTO muhurats (name, starts_at, ends_at, kind) VALUES ($1,$2,$3,$4) RETURNING *`, [name, startsAt, endsAt, kind ?? null]);
  return rows[0];
}
