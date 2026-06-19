import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './payments.service';
import { verifySignature } from '../../services/payment-gateway';

const initiateSchema = z.object({ order_id: z.string().uuid() });
export async function initiate(req: Request, res: Response) {
  const { order_id } = initiateSchema.parse(req.body);
  res.status(201).json(await svc.initiate(req.user!.id, order_id));
}
const confirmSchema = z.object({ payment_id: z.string().uuid(), gateway_ref: z.string(), signature: z.string().optional() });
export async function confirm(req: Request, res: Response) {
  const { payment_id, gateway_ref, signature } = confirmSchema.parse(req.body);
  if (signature && !verifySignature(gateway_ref, signature)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid payment signature.' });
  }
  res.json(await svc.confirm(req.user!.id, payment_id, gateway_ref));
}
export async function list(req: Request, res: Response) {
  res.json({ payments: await svc.listMyPayments(req.user!.id) });
}
