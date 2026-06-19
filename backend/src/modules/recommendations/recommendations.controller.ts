import { Request, Response } from 'express';
import * as svc from './recommendations.service';

export async function mine(req: Request, res: Response) {
  res.json(await svc.forUser(req.user!.id));
}
