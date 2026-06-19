import { query } from '../../config/db';
import { redis } from '../../config/redis';
import { Errors } from '../../utils/errors';

const CACHE_TTL = 300; // 5 min

export interface PoojaFilter {
  category?: string;   // category slug
  q?: string;          // free text
  minPrice?: number;
  maxPrice?: number;
  limit: number;
  offset: number;
}

export async function listCategories() {
  const cacheKey = 'cache:categories';
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);
  const { rows } = await query(
    `SELECT id, slug, name, icon_url, sort_order FROM pooja_categories
     WHERE is_active = true ORDER BY sort_order, name`,
  );
  await redis.set(cacheKey, JSON.stringify(rows), 'EX', CACHE_TTL).catch(() => {});
  return rows;
}

export async function listPoojas(f: PoojaFilter) {
  const where: string[] = ['p.is_active = true'];
  const params: any[] = [];
  let i = 1;
  if (f.category) {
    where.push(`c.slug = $${i++}`);
    params.push(f.category);
  }
  if (f.q) {
    where.push(`p.search_tsv @@ plainto_tsquery('simple', $${i++})`);
    params.push(f.q);
  }
  if (f.minPrice !== undefined) {
    where.push(`p.base_price >= $${i++}`);
    params.push(f.minPrice);
  }
  if (f.maxPrice !== undefined) {
    where.push(`p.base_price <= $${i++}`);
    params.push(f.maxPrice);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(f.limit, f.offset);
  const { rows } = await query(
    `SELECT p.id, p.slug, p.title, p.description, p.benefits, p.duration_mins,
            p.base_price, p.image_url, c.slug AS category_slug, c.name AS category_name
     FROM poojas p
     LEFT JOIN pooja_categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY p.title
     LIMIT $${i++} OFFSET $${i++}`,
    params,
  );
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM poojas p
     LEFT JOIN pooja_categories c ON c.id = p.category_id ${whereSql}`,
    params.slice(0, params.length - 2),
  );
  return { poojas: rows, total: Number(countRes.rows[0]?.count ?? 0) };
}

export async function getPoojaBySlug(slug: string) {
  const { rows } = await query(
    `SELECT p.*, c.slug AS category_slug, c.name AS category_name
     FROM poojas p LEFT JOIN pooja_categories c ON c.id = p.category_id
     WHERE p.slug = $1 AND p.is_active = true`,
    [slug],
  );
  if (!rows[0]) throw Errors.notFound('Puja not found.');
  return rows[0];
}

// Admin
export async function upsertCategory(data: any) {
  const { rows } = await query(
    `INSERT INTO pooja_categories (slug, name, icon_url, sort_order)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, icon_url=EXCLUDED.icon_url, sort_order=EXCLUDED.sort_order
     RETURNING *`,
    [data.slug, data.name, data.icon_url ?? null, data.sort_order ?? 0],
  );
  await redis.del('cache:categories').catch(() => {});
  return rows[0];
}

export async function upsertPooja(data: any) {
  const { rows } = await query(
    `INSERT INTO poojas (slug, title, category_id, description, benefits, duration_mins, base_price, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, category_id=EXCLUDED.category_id,
       description=EXCLUDED.description, benefits=EXCLUDED.benefits, duration_mins=EXCLUDED.duration_mins,
       base_price=EXCLUDED.base_price, image_url=EXCLUDED.image_url
     RETURNING *`,
    [data.slug, data.title, data.category_id ?? null, data.description ?? null,
     data.benefits ?? null, data.duration_mins ?? null, data.base_price ?? 0, data.image_url ?? null],
  );
  return rows[0];
}
