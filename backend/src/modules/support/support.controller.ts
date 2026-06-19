import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './support.service';

const createSchema = z.object({ subject: z.string().min(3).max(200), body: z.string().min(1), priority: z.enum(['low','normal','high']).default('normal') });
export async function create(req: Request, res: Response) {
  const b = createSchema.parse(req.body);
  res.status(201).json(await svc.createTicket(req.user!.id, b.subject, b.body, b.priority));
}
export async function list(req: Request, res: Response) {
  res.json({ tickets: await svc.listMine(req.user!.id) });
}
export async function get(req: Request, res: Response) {
  res.json(await svc.getTicket(req.user!.id, req.params.id, req.user!.role === 'admin'));
}
const replySchema = z.object({ body: z.string().min(1) });
export async function reply(req: Request, res: Response) {
  const { body } = replySchema.parse(req.body);
  res.status(201).json(await svc.reply(req.user!.id, req.params.id, body, req.user!.role === 'admin'));
}
const statusSchema = z.object({ status: z.enum(['open','pending','resolved','closed']) });
export async function setStatus(req: Request, res: Response) {
  res.json(await svc.setStatus(req.params.id, statusSchema.parse(req.body).status));
}
