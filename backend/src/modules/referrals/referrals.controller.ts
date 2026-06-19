import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './referrals.service';

const applySchema = z.object({ code: z.string().min(4).max(20) });
export async function apply(req: Request, res: Response) {
  res.status(201).json(await svc.applyReferral(req.user!.id, applySchema.parse(req.body).code));
}
export async function mine(req: Request, res: Response) {
  res.json(await svc.myReferrals(req.user!.id));
}
