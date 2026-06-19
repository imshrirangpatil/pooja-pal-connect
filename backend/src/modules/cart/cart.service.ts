import { query } from '../../config/db';
import { Errors } from '../../utils/errors';

/** Resolve current unit price + title for a cart/order line. */
export async function priceOf(itemType: 'kit' | 'pooja', itemId: string): Promise<{ title: string; price: number }> {
  if (itemType === 'kit') {
    const { rows } = await query<{ title: string; price: number }>('SELECT title, price FROM kits WHERE id = $1 AND is_active = true', [itemId]);
    if (!rows[0]) throw Errors.notFound('Kit not found.');
    return rows[0];
  }
  const { rows } = await query<{ title: string; price: number }>('SELECT title, base_price AS price FROM poojas WHERE id = $1 AND is_active = true', [itemId]);
  if (!rows[0]) throw Errors.notFound('Puja not found.');
  return rows[0];
}

export async function getCart(userId: string) {
  const { rows } = await query(
    `SELECT id, item_type, item_id, quantity FROM cart_items WHERE user_id = $1 ORDER BY created_at`,
    [userId],
  );
  let subtotal = 0;
  const items = [];
  for (const r of rows) {
    const { title, price } = await priceOf(r.item_type, r.item_id);
    subtotal += price * r.quantity;
    items.push({ ...r, title, unit_price: price, line_total: price * r.quantity });
  }
  return { items, subtotal, count: items.length };
}

export async function addItem(userId: string, itemType: 'kit' | 'pooja', itemId: string, quantity: number) {
  await priceOf(itemType, itemId); // validates existence
  await query(
    `INSERT INTO cart_items (user_id, item_type, item_id, quantity)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [userId, itemType, itemId, quantity],
  );
  return getCart(userId);
}

export async function updateItem(userId: string, id: string, quantity: number) {
  const { rowCount } = await query('UPDATE cart_items SET quantity = $3 WHERE id = $1 AND user_id = $2', [id, userId, quantity]);
  if (!rowCount) throw Errors.notFound('Cart item not found.');
  return getCart(userId);
}

export async function removeItem(userId: string, id: string) {
  await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId]);
  return getCart(userId);
}

export async function clearCart(userId: string) {
  await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
}
