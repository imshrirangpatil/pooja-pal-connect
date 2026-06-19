import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './reviews.service';

const reviewSchema = z.object({
  target_type: z.enum(['pandit','pooja']),
  target_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
export async function create(req: Request, res: Response) {
  const b = reviewSchema.parse(req.body);
  res.status(201).json(await svc.upsertReview(req.user!.id, b.target_type, b.target_id, b.rating, b.comment));
}
export async function list(req: Request, res: Response) {
  const { target_type, target_id } = z.object({ target_type: z.enum(['pandit','pooja']), target_id: z.string().uuid() }).parse(req.query);
  res.json({ reviews: await svc.listForTarget(target_type, target_id) });
}
