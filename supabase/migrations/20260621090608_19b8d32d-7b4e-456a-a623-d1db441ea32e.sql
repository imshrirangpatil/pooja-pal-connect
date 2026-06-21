CREATE TYPE public.sku_category AS ENUM ('kit', 'samagri', 'blessed');

CREATE TABLE public.store_skus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category public.sku_category NOT NULL DEFAULT 'samagri',
  price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
  mrp_paise INTEGER NOT NULL CHECK (mrp_paise >= 0),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_skus TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_skus TO authenticated;
GRANT ALL ON public.store_skus TO service_role;

ALTER TABLE public.store_skus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active SKUs"
  ON public.store_skus FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert SKUs"
  ON public.store_skus FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update SKUs"
  ON public.store_skus FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete SKUs"
  ON public.store_skus FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER store_skus_set_updated_at
  BEFORE UPDATE ON public.store_skus
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_store_skus_category_active ON public.store_skus(category, active, sort_order);