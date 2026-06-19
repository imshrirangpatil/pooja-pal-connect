import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './video.service';

const createSchema = z.object({ booking_id: z.string().uuid().optional(), pandit_id: z.string().uuid().optional() });
export async function create(req: Request, res: Response) {
  const { booking_id, pandit_id } = createSchema.parse(req.body);
  res.status(201).json(await svc.createSession(req.user!.id, booking_id, pandit_id));
}
export async function token(req: Request, res: Response) {
  res.json(await svc.getToken(req.user!.id, req.params.id));
}
export async function end(req: Request, res: Response) {
  res.json(await svc.endSession(req.params.id));
}
