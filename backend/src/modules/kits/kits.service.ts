import { query, withTransaction } from '../../config/db';
import { Errors } from '../../utils/errors';

export async function listKits(limit = 20, offset = 0) {
  const { rows } = await query(
    `SELECT k.*, COALESCE(i.stock_qty, 0) AS stock_qty
     FROM kits k LEFT JOIN inventory i ON i.kit_id = k.id
     WHERE k.is_active = true ORDER BY k.title LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return rows;
}

export async function getKit(slug: string) {
  const { rows } = await query(
    `SELECT k.*, COALESCE(i.stock_qty,0) AS stock_qty FROM kits k
     LEFT JOIN inventory i ON i.kit_id = k.id WHERE k.slug = $1`,
    [slug],
  );
  if (!rows[0]) throw Errors.notFound('Kit not found.');
  const items = await query('SELECT name, quantity FROM kit_items WHERE kit_id = $1', [rows[0].id]);
  return { ...rows[0], items: items.rows };
}

// Admin
export async function upsertKit(data: any) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO kits (id, slug, title, description, price, image_url, pooja_id)
       VALUES (COALESCE($1, gen_random_uuid()),$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, title=EXCLUDED.title, description=EXCLUDED.description,
         price=EXCLUDED.price, image_url=EXCLUDED.image_url, pooja_id=EXCLUDED.pooja_id
       RETURNING *`,
      [data.id ?? null, data.slug, data.title, data.description ?? null, data.price ?? 0, data.image_url ?? null, data.pooja_id ?? null],
    );
    const kit = rows[0];
    if (Array.isArray(data.items)) {
      await client.query('DELETE FROM kit_items WHERE kit_id = $1', [kit.id]);
      for (const it of data.items) {
        await client.query('INSERT INTO kit_items (kit_id, name, quantity) VALUES ($1,$2,$3)',
          [kit.id, it.name, it.quantity ?? '1']);
      }
    }
    await client.query(
      `INSERT INTO inventory (kit_id, stock_qty) VALUES ($1, $2)
       ON CONFLICT (kit_id) DO NOTHING`, [kit.id, data.stock_qty ?? 0]);
    return kit;
  });
}

export async function getInventory() {
  const { rows } = await query(
    `SELECT k.id AS kit_id, k.title, COALESCE(i.stock_qty,0) AS stock_qty
     FROM kits k LEFT JOIN inventory i ON i.kit_id = k.id ORDER BY k.title`);
  return rows;
}

export async function setInventory(kitId: string, qty: number) {
  const { rows } = await query(
    `INSERT INTO inventory (kit_id, stock_qty) VALUES ($1,$2)
     ON CONFLICT (kit_id) DO UPDATE SET stock_qty = EXCLUDED.stock_qty RETURNING *`,
    [kitId, qty],
  );
  return rows[0];
}

/** Decrement stock atomically; throws if insufficient. Used by Order module. */
export async function reserveStock(client: any, kitId: string, qty: number) {
  const r = await client.query(
    `UPDATE inventory SET stock_qty = stock_qty - $2
     WHERE kit_id = $1 AND stock_qty >= $2 RETURNING stock_qty`,
    [kitId, qty],
  );
  if (!r.rows[0]) throw Errors.validation('Insufficient stock for one or more kits.');
  return r.rows[0].stock_qty;
}
