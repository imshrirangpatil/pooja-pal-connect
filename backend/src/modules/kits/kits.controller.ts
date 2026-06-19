import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './kits.service';

export async function list(req: Request, res: Response) {
  const { limit, offset } = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20), offset: z.coerce.number().int().nonnegative().default(0) }).parse(req.query);
  res.json({ kits: await svc.listKits(limit, offset) });
}
export async function get(req: Request, res: Response) {
  res.json(await svc.getKit(req.params.slug));
}
const kitInput = z.object({
  id: z.string().uuid().optional(), slug: z.string(), title: z.string(),
  description: z.string().optional(), price: z.number().int().nonnegative().optional(),
  image_url: z.string().url().optional(), pooja_id: z.string().uuid().optional(),
  stock_qty: z.number().int().nonnegative().optional(),
  items: z.array(z.object({ name: z.string(), quantity: z.string().optional() })).optional(),
});
export async function upsert(req: Request, res: Response) {
  res.json(await svc.upsertKit(kitInput.parse(req.body)));
}
export async function getInventory(_req: Request, res: Response) {
  res.json({ inventory: await svc.getInventory() });
}
const invInput = z.object({ kit_id: z.string().uuid(), stock_qty: z.number().int().nonnegative() });
export async function setInventory(req: Request, res: Response) {
  const { kit_id, stock_qty } = invInput.parse(req.body);
  res.json(await svc.setInventory(kit_id, stock_qty));
}
