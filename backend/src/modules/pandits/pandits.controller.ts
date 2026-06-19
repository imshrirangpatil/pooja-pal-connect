import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './pandits.service';

const filterSchema = z.object({
  city: z.string().optional(),
  specialization: z.string().optional(),
  language: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function listPandits(req: Request, res: Response) {
  res.json(await svc.listPandits(filterSchema.parse(req.query)));
}
export async function getPandit(req: Request, res: Response) {
  res.json(await svc.getPandit(req.params.id));
}
export async function getAvailability(req: Request, res: Response) {
  const { from, to } = z.object({ from: z.string().optional(), to: z.string().optional() }).parse(req.query);
  res.json({ slots: await svc.getAvailability(req.params.id, from, to) });
}

const panditInput = z.object({
  id: z.string().uuid().optional(), user_id: z.string().uuid().optional(),
  name: z.string().min(2), bio: z.string().optional(), photo_url: z.string().url().optional(),
  city: z.string().optional(), languages: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(), experience_yrs: z.number().int().optional(),
  is_verified: z.boolean().optional(),
});
export async function upsertPandit(req: Request, res: Response) {
  res.json(await svc.upsertPandit(panditInput.parse(req.body)));
}
const slotsInput = z.object({ slots: z.array(z.object({ slot_start: z.string(), slot_end: z.string() })).min(1) });
export async function addAvailability(req: Request, res: Response) {
  const { slots } = slotsInput.parse(req.body);
  res.status(201).json({ created: await svc.addAvailability(req.params.id, slots) });
}
