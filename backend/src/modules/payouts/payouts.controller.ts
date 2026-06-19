import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './payouts.service';

export async function earnings(req: Request, res: Response) {
  const panditId = await svc.panditIdForUser(req.user!.id);
  res.json(await svc.earnings(panditId));
}
export async function list(req: Request, res: Response) {
  const panditId = await svc.panditIdForUser(req.user!.id);
  res.json({ payouts: await svc.listPayouts(panditId) });
}
const reqSchema = z.object({ amount: z.number().int().positive() });
export async function request(req: Request, res: Response) {
  const panditId = await svc.panditIdForUser(req.user!.id);
  res.status(201).json(await svc.requestPayout(panditId, reqSchema.parse(req.body).amount));
}
const procSchema = z.object({ status: z.enum(['processing','paid','rejected']), reference: z.string().optional() });
export async function process(req: Request, res: Response) {
  const b = procSchema.parse(req.body);
  res.json(await svc.processPayout(req.params.id, b.status, b.reference));
}
