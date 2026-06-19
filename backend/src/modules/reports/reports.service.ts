import { query } from '../../config/db';
import { Errors } from '../../utils/errors';

/**
 * Report generation (PDF Kundli / certificates). Real rendering is async and
 * external (a PDF worker writes to S3 then sets file_url). Here we enqueue the
 * request; a worker would later flip status to 'ready'. STUB worker hook below.
 */
export async function requestReport(userId: string, kind: 'kundli' | 'certificate', params?: Record<string, unknown>) {
  const { rows } = await query(
    `INSERT INTO reports (user_id, kind, status, params) VALUES ($1,$2,'queued',$3) RETURNING *`,
    [userId, kind, params ?? null],
  );
  // TODO(reports): enqueue a job (BullMQ/SQS) that renders the PDF and updates file_url.
  return rows[0];
}

export async function getReport(userId: string, id: string) {
  const { rows } = await query('SELECT * FROM reports WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!rows[0]) throw Errors.notFound('Report not found.');
  return rows[0];
}

export async function listMine(userId: string) {
  const { rows } = await query('SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
}
