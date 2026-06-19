import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './catalog.service';

const filterSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function listCategories(_req: Request, res: Response) {
  res.json({ categories: await svc.listCategories() });
}
export async function listPoojas(req: Request, res: Response) {
  const f = filterSchema.parse(req.query);
  res.json(await svc.listPoojas(f));
}
export async function getPooja(req: Request, res: Response) {
  res.json(await svc.getPoojaBySlug(req.params.slug));
}

const categoryInput = z.object({ slug: z.string(), name: z.string(), icon_url: z.string().url().optional(), sort_order: z.number().int().optional() });
const poojaInput = z.object({
  slug: z.string(), title: z.string(), category_id: z.string().uuid().optional(),
  description: z.string().optional(), benefits: z.string().optional(),
  duration_mins: z.number().int().optional(), base_price: z.number().int().nonnegative().optional(),
  image_url: z.string().url().optional(),
});
export async function upsertCategory(req: Request, res: Response) {
  res.json(await svc.upsertCategory(categoryInput.parse(req.body)));
}
export async function upsertPooja(req: Request, res: Response) {
  res.json(await svc.upsertPooja(poojaInput.parse(req.body)));
}
