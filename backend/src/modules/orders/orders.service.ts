import { withTransaction, query } from '../../config/db';
import { Errors } from '../../utils/errors';
import { priceOf } from '../cart/cart.service';
import { reserveStock } from '../kits/kits.service';
import { addCreditTransaction } from '../users/users.service';

// Credits can cover at most this fraction of an order (v1 rule).
const MAX_CREDIT_FRACTION = 0.2;

export interface CreateOrderInput {
  address_id?: string;
  use_credits?: boolean;   // apply credits up to the 20% cap
}

/**
 * Build an order from the user's cart. Computes subtotal, optionally applies
 * credits (capped at 20% of subtotal, and never more than the balance),
 * reserves kit stock, and clears the cart — all atomically.
 */
export async function createOrderFromCart(userId: string, input: CreateOrderInput) {
  return withTransaction(async (client) => {
    const cart = await client.query(
      'SELECT item_type, item_id, quantity FROM cart_items WHERE user_id = $1', [userId]);
    if (cart.rows.length === 0) throw Errors.validation('Your cart is empty.');

    let subtotal = 0;
    const lines: { item_type: string; item_id: string; title: string; unit_price: number; quantity: number }[] = [];
    for (const c of cart.rows) {
      const { title, price } = await priceOf(c.item_type, c.item_id);
      subtotal += price * c.quantity;
      lines.push({ item_type: c.item_type, item_id: c.item_id, title, unit_price: price, quantity: c.quantity });
      if (c.item_type === 'kit') await reserveStock(client, c.item_id, c.quantity);
    }

    let creditsApplied = 0;
    if (input.use_credits) {
      const u = await client.query<{ credits_balance: number }>('SELECT credits_balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
      const balance = u.rows[0]?.credits_balance ?? 0;
      const cap = Math.floor(subtotal * MAX_CREDIT_FRACTION);
      creditsApplied = Math.min(balance, cap);
    }
    const total = subtotal - creditsApplied;

    const order = await client.query(
      `INSERT INTO orders (user_id, address_id, subtotal, credits_applied, total, status)
       VALUES ($1,$2,$3,$4,$5,'created') RETURNING *`,
      [userId, input.address_id ?? null, subtotal, creditsApplied, total],
    );
    const orderId = order.rows[0].id;
    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, item_type, item_id, title, unit_price, quantity)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, l.item_type, l.item_id, l.title, l.unit_price, l.quantity],
      );
    }

    // Redeem credits within the same transaction (ledger + balance).
    if (creditsApplied > 0) {
      // inline redemption to stay in the transaction
      const cur = await client.query<{ credits_balance: number }>('SELECT credits_balance FROM users WHERE id = $1', [userId]);
      const next = cur.rows[0].credits_balance - creditsApplied;
      if (next < 0) throw Errors.insufficientCredits();
      await client.query('UPDATE users SET credits_balance = $2 WHERE id = $1', [userId, next]);
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, source, reference_id, description, balance_after)
         VALUES ($1,'redeemed',$2,'promotion',$3,$4,$5)`,
        [userId, creditsApplied, orderId, 'Credits applied at checkout', next],
      );
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    return { ...order.rows[0], items: lines };
  });
}

export async function listMyOrders(userId: string) {
  const { rows } = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
}

export async function getOrder(userId: string, id: string) {
  const { rows } = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!rows[0]) throw Errors.notFound('Order not found.');
  const items = await query('SELECT item_type, item_id, title, unit_price, quantity FROM order_items WHERE order_id = $1', [id]);
  return { ...rows[0], items: items.rows };
}

export async function cancelOrder(userId: string, id: string) {
  return withTransaction(async (client) => {
    const o = await client.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE', [id, userId]);
    if (!o.rows[0]) throw Errors.notFound('Order not found.');
    if (!['created', 'paid'].includes(o.rows[0].status))
      throw Errors.validation(`Cannot cancel an order in status ${o.rows[0].status}.`);
    const { rows } = await client.query(`UPDATE orders SET status='cancelled' WHERE id=$1 RETURNING *`, [id]);
    // Refund any applied credits back to the ledger.
    if (o.rows[0].credits_applied > 0) {
      await addCreditTransaction({
        userId, type: 'refunded', amount: o.rows[0].credits_applied,
        source: 'order_refund', referenceId: id, description: 'Refund of credits on cancelled order',
      });
    }
    return rows[0];
  });
}

export async function updateStatus(id: string, status: string) {
  const { rows } = await query('UPDATE orders SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
  if (!rows[0]) throw Errors.notFound('Order not found.');
  return rows[0];
}
