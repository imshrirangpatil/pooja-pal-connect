import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './search.service';

const schema = z.object({ q: z.string().min(1), limit: z.coerce.number().int().min(1).max(50).default(20) });
export async function search(req: Request, res: Response) {
  const { q, limit } = schema.parse(req.query);
  res.json(await svc.search(q, limit));
}
