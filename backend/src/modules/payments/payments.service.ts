import { query, withTransaction } from '../../config/db';
import { Errors } from '../../utils/errors';
import { createGatewayOrder } from '../../services/payment-gateway';

/** Create a payment intent for an order and a matching gateway order. */
export async function initiate(userId: string, orderId: string) {
  const o = await query<{ id: string; total: number; status: string }>(
    'SELECT id, total, status FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
  if (!o.rows[0]) throw Errors.notFound('Order not found.');
  if (o.rows[0].status !== 'created') throw Errors.validation('Order is not awaiting payment.');

  const gateway = await createGatewayOrder(o.rows[0].total, 'INR');
  const { rows } = await query(
    `INSERT INTO payments (order_id, user_id, gateway, gateway_ref, amount, currency, status)
     VALUES ($1,$2,'razorpay',$3,$4,'INR','created') RETURNING *`,
    [orderId, userId, gateway.gatewayRef, o.rows[0].total],
  );
  return { payment: rows[0], gateway };
}

/** Mark a payment captured and move the order to 'paid' (idempotent-ish). */
export async function confirm(userId: string, paymentId: string, gatewayRef: string) {
  return withTransaction(async (client) => {
    const p = await client.query('SELECT * FROM payments WHERE id = $1 AND user_id = $2 FOR UPDATE', [paymentId, userId]);
    if (!p.rows[0]) throw Errors.notFound('Payment not found.');
    if (p.rows[0].status === 'captured') return p.rows[0];
    await client.query(`UPDATE payments SET status='captured', gateway_ref=$2 WHERE id=$1`, [paymentId, gatewayRef]);
    if (p.rows[0].order_id)
      await client.query(`UPDATE orders SET status='paid' WHERE id=$1`, [p.rows[0].order_id]);
    const { rows } = await client.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    return rows[0];
  });
}

export async function listMyPayments(userId: string) {
  const { rows } = await query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
}
