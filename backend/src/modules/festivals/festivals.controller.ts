import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './festivals.service';

export async function festivals(_req: Request, res: Response) {
  res.json({ festivals: await svc.upcomingFestivals() });
}
export async function muhurats(_req: Request, res: Response) {
  res.json({ muhurats: await svc.upcomingMuhurats() });
}
const fSchema = z.object({ name: z.string(), date: z.string(), description: z.string().optional() });
export async function addFestival(req: Request, res: Response) {
  const b = fSchema.parse(req.body);
  res.status(201).json(await svc.addFestival(b.name, b.date, b.description));
}
const mSchema = z.object({ name: z.string(), starts_at: z.string(), ends_at: z.string(), kind: z.string().optional() });
export async function addMuhurat(req: Request, res: Response) {
  const b = mSchema.parse(req.body);
  res.status(201).json(await svc.addMuhurat(b.name, b.starts_at, b.ends_at, b.kind));
}
