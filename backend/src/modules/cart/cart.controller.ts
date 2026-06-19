import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './cart.service';

export async function get(req: Request, res: Response) {
  res.json(await svc.getCart(req.user!.id));
}
const addSchema = z.object({ item_type: z.enum(['kit','pooja']), item_id: z.string().uuid(), quantity: z.number().int().min(1).default(1) });
export async function add(req: Request, res: Response) {
  const { item_type, item_id, quantity } = addSchema.parse(req.body);
  res.status(201).json(await svc.addItem(req.user!.id, item_type, item_id, quantity));
}
const qtySchema = z.object({ quantity: z.number().int().min(1) });
export async function update(req: Request, res: Response) {
  const { quantity } = qtySchema.parse(req.body);
  res.json(await svc.updateItem(req.user!.id, req.params.id, quantity));
}
export async function remove(req: Request, res: Response) {
  res.json(await svc.removeItem(req.user!.id, req.params.id));
}
export async function clear(req: Request, res: Response) {
  await svc.clearCart(req.user!.id);
  res.json({ message: 'Cart cleared' });
}
