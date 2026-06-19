import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './admin.service';

const pg = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50), offset: z.coerce.number().int().nonnegative().default(0) });

export async function dashboard(_req: Request, res: Response) {
  res.json(await svc.dashboard());
}
export async function listUsers(req: Request, res: Response) {
  const { limit, offset } = pg.parse(req.query);
  res.json({ users: await svc.listUsers(limit, offset) });
}
export async function listOrders(req: Request, res: Response) {
  const { limit, offset } = pg.parse(req.query);
  res.json({ orders: await svc.listAllOrders(limit, offset) });
}
const roleSchema = z.object({ role: z.enum(['user','pandit','admin']) });
export async function setUserRole(req: Request, res: Response) {
  res.json(await svc.setUserRole(req.params.id, roleSchema.parse(req.body).role));
}
const grantSchema = z.object({ amount: z.number().int().positive(), description: z.string().optional() });
export async function grantCredits(req: Request, res: Response) {
  const { amount, description } = grantSchema.parse(req.body);
  res.json(await svc.grantCredits(req.params.id, amount, description));
}
