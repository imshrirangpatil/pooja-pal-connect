import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './subscriptions.service';

export async function plans(_req: Request, res: Response) {
  res.json({ plans: await svc.listPlans() });
}
const subSchema = z.object({ plan_id: z.string().uuid() });
export async function subscribe(req: Request, res: Response) {
  res.status(201).json(await svc.subscribe(req.user!.id, subSchema.parse(req.body).plan_id));
}
export async function mine(req: Request, res: Response) {
  res.json({ subscription: await svc.mySubscription(req.user!.id) });
}
export async function cancel(req: Request, res: Response) {
  res.json(await svc.cancel(req.user!.id, req.params.id));
}
