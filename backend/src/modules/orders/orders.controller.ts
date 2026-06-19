import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './orders.service';

const createSchema = z.object({ address_id: z.string().uuid().optional(), use_credits: z.boolean().optional() });
export async function create(req: Request, res: Response) {
  res.status(201).json(await svc.createOrderFromCart(req.user!.id, createSchema.parse(req.body)));
}
export async function list(req: Request, res: Response) {
  res.json({ orders: await svc.listMyOrders(req.user!.id) });
}
export async function get(req: Request, res: Response) {
  res.json(await svc.getOrder(req.user!.id, req.params.id));
}
export async function cancel(req: Request, res: Response) {
  res.json(await svc.cancelOrder(req.user!.id, req.params.id));
}
const statusSchema = z.object({ status: z.enum(['created','paid','packed','shipped','delivered','cancelled','refunded']) });
export async function updateStatus(req: Request, res: Response) {
  res.json(await svc.updateStatus(req.params.id, statusSchema.parse(req.body).status));
}
