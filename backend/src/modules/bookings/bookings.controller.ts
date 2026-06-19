import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './bookings.service';

const createSchema = z.object({
  pooja_id: z.string().uuid().optional(),
  pandit_id: z.string().uuid().optional(),
  slot_id: z.string().uuid().optional(),
  scheduled_at: z.string().datetime().optional(),
  sankalp_name: z.string().max(120).optional(),
  gotra: z.string().max(100).optional(),
  nakshatra: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export async function create(req: Request, res: Response) {
  res.status(201).json(await svc.createBooking(req.user!.id, createSchema.parse(req.body)));
}
export async function list(req: Request, res: Response) {
  res.json({ bookings: await svc.listMyBookings(req.user!.id) });
}
export async function get(req: Request, res: Response) {
  res.json(await svc.getBooking(req.user!.id, req.params.id));
}
export async function cancel(req: Request, res: Response) {
  res.json(await svc.cancelBooking(req.user!.id, req.params.id));
}
const statusSchema = z.object({ status: z.enum(['pending','confirmed','in_progress','completed','cancelled']) });
export async function updateStatus(req: Request, res: Response) {
  const { status } = statusSchema.parse(req.body);
  res.json(await svc.updateStatus(req.params.id, status));
}
