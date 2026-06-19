import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './notifications.service';

export async function list(req: Request, res: Response) {
  const { unread } = z.object({ unread: z.coerce.boolean().optional() }).parse(req.query);
  res.json({ notifications: await svc.list(req.user!.id, unread) });
}
export async function markRead(req: Request, res: Response) {
  await svc.markRead(req.user!.id, req.params.id);
  res.json({ message: 'Marked read' });
}
export async function markAllRead(req: Request, res: Response) {
  await svc.markAllRead(req.user!.id);
  res.json({ message: 'All marked read' });
}
