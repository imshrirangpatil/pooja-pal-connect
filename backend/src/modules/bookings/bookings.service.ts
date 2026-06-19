import { query, withTransaction } from '../../config/db';
import { Errors } from '../../utils/errors';

export interface CreateBookingInput {
  pooja_id?: string;
  pandit_id?: string;
  slot_id?: string;
  scheduled_at?: string;
  sankalp_name?: string;
  gotra?: string;
  nakshatra?: string;
  notes?: string;
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  return withTransaction(async (client) => {
    let amount = 0;
    if (input.pooja_id) {
      const p = await client.query<{ base_price: number }>('SELECT base_price FROM poojas WHERE id = $1', [input.pooja_id]);
      if (!p.rows[0]) throw Errors.notFound('Puja not found.');
      amount = p.rows[0].base_price;
    }
    // If a slot is specified, lock and mark it booked.
    if (input.slot_id) {
      const slot = await client.query('SELECT id, is_booked FROM pandit_availability WHERE id = $1 FOR UPDATE', [input.slot_id]);
      if (!slot.rows[0]) throw Errors.notFound('Slot not found.');
      if (slot.rows[0].is_booked) throw Errors.validation('That slot is already booked.');
      await client.query('UPDATE pandit_availability SET is_booked = true WHERE id = $1', [input.slot_id]);
    }
    const { rows } = await client.query(
      `INSERT INTO bookings (user_id, pooja_id, pandit_id, slot_id, scheduled_at, sankalp_name, gotra, nakshatra, notes, amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [userId, input.pooja_id ?? null, input.pandit_id ?? null, input.slot_id ?? null,
       input.scheduled_at ?? null, input.sankalp_name ?? null, input.gotra ?? null,
       input.nakshatra ?? null, input.notes ?? null, amount],
    );
    return rows[0];
  });
}

export async function listMyBookings(userId: string) {
  const { rows } = await query(
    `SELECT b.*, p.title AS pooja_title, pa.name AS pandit_name
     FROM bookings b
     LEFT JOIN poojas p ON p.id = b.pooja_id
     LEFT JOIN pandits pa ON pa.id = b.pandit_id
     WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
    [userId],
  );
  return rows;
}

export async function getBooking(userId: string, id: string) {
  const { rows } = await query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!rows[0]) throw Errors.notFound('Booking not found.');
  return rows[0];
}

export async function cancelBooking(userId: string, id: string) {
  return withTransaction(async (client) => {
    const b = await client.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2 FOR UPDATE', [id, userId]);
    if (!b.rows[0]) throw Errors.notFound('Booking not found.');
    if (['completed', 'cancelled'].includes(b.rows[0].status))
      throw Errors.validation(`Cannot cancel a ${b.rows[0].status} booking.`);
    if (b.rows[0].slot_id)
      await client.query('UPDATE pandit_availability SET is_booked = false WHERE id = $1', [b.rows[0].slot_id]);
    const { rows } = await client.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`, [id]);
    return rows[0];
  });
}

// Admin/pandit status transition
export async function updateStatus(id: string, status: string) {
  const { rows } = await query('UPDATE bookings SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
  if (!rows[0]) throw Errors.notFound('Booking not found.');
  return rows[0];
}
