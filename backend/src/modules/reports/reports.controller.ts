import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './reports.service';

const reqSchema = z.object({ kind: z.enum(['kundli','certificate']), params: z.record(z.unknown()).optional() });
export async function request(req: Request, res: Response) {
  const { kind, params } = reqSchema.parse(req.body);
  res.status(202).json(await svc.requestReport(req.user!.id, kind, params));
}
export async function get(req: Request, res: Response) {
  res.json(await svc.getReport(req.user!.id, req.params.id));
}
export async function list(req: Request, res: Response) {
  res.json({ reports: await svc.listMine(req.user!.id) });
}
