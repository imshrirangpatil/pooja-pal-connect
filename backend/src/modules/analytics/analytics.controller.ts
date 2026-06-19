import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './analytics.service';

const trackSchema = z.object({ name: z.string().min(1).max(120), props: z.record(z.unknown()).optional() });
export async function track(req: Request, res: Response) {
  const { name, props } = trackSchema.parse(req.body);
  res.status(201).json(await svc.track(req.user?.id ?? null, name, props));
}
export async function summary(req: Request, res: Response) {
  const { days } = z.object({ days: z.coerce.number().int().min(1).max(90).default(7) }).parse(req.query);
  res.json({ summary: await svc.summary(days) });
}
