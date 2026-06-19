import { query, withTransaction } from '../../config/db';
import { Errors } from '../../utils/errors';

export async function createTicket(userId: string, subject: string, body: string, priority = 'normal') {
  return withTransaction(async (client) => {
    const t = await client.query(
      `INSERT INTO support_tickets (user_id, subject, priority) VALUES ($1,$2,$3) RETURNING *`,
      [userId, subject, priority],
    );
    await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, is_staff, body) VALUES ($1,$2,false,$3)`,
      [t.rows[0].id, userId, body],
    );
    return t.rows[0];
  });
}

export async function listMine(userId: string) {
  const { rows } = await query('SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
}

export async function getTicket(userId: string, id: string, isAdmin: boolean) {
  const { rows } = await query(
    `SELECT * FROM support_tickets WHERE id = $1 ${isAdmin ? '' : 'AND user_id = $2'}`,
    isAdmin ? [id] : [id, userId],
  );
  if (!rows[0]) throw Errors.notFound('Ticket not found.');
  const msgs = await query('SELECT sender_id, is_staff, body, created_at FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at', [id]);
  return { ...rows[0], messages: msgs.rows };
}

export async function reply(userId: string, ticketId: string, body: string, isStaff: boolean) {
  const t = await query('SELECT id, user_id FROM support_tickets WHERE id = $1', [ticketId]);
  if (!t.rows[0]) throw Errors.notFound('Ticket not found.');
  if (!isStaff && t.rows[0].user_id !== userId) throw Errors.forbidden();
  const { rows } = await query(
    `INSERT INTO ticket_messages (ticket_id, sender_id, is_staff, body) VALUES ($1,$2,$3,$4) RETURNING *`,
    [ticketId, userId, isStaff, body],
  );
  // Reopen if a user replies to a resolved ticket.
  if (!isStaff) await query(`UPDATE support_tickets SET status='open' WHERE id=$1 AND status IN ('resolved','closed')`, [ticketId]);
  return rows[0];
}

export async function setStatus(id: string, status: string) {
  const { rows } = await query('UPDATE support_tickets SET status=$2 WHERE id=$1 RETURNING *', [id, status]);
  if (!rows[0]) throw Errors.notFound('Ticket not found.');
  return rows[0];
}
