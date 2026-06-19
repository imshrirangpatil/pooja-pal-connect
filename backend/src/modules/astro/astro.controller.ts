import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './astro.service';

const startSchema = z.object({ astrologer_id: z.string(), astrologer_name: z.string(), price_per_min: z.number().int().nonnegative().default(0) });
export async function start(req: Request, res: Response) {
  const b = startSchema.parse(req.body);
  res.status(201).json(await svc.startSession(req.user!.id, b.astrologer_id, b.astrologer_name, b.price_per_min));
}
const msgSchema = z.object({ sender: z.enum(['user','astrologer','system']).default('user'), body: z.string().min(1) });
export async function message(req: Request, res: Response) {
  const { sender, body } = msgSchema.parse(req.body);
  res.status(201).json(await svc.postMessage(req.user!.id, req.params.id, sender, body));
}
export async function messages(req: Request, res: Response) {
  res.json({ messages: await svc.getMessages(req.user!.id, req.params.id) });
}
const endSchema = z.object({ seconds_elapsed: z.number().int().nonnegative() });
export async function end(req: Request, res: Response) {
  res.json(await svc.endSession(req.user!.id, req.params.id, endSchema.parse(req.body).seconds_elapsed));
}
