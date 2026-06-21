
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.festivals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  festival_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('major','vrat','ekadashi','amavasya','purnima')),
  note TEXT NOT NULL DEFAULT '',
  pooja_slug TEXT,
  pooja_label TEXT,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX festivals_date_idx ON public.festivals(festival_date);

GRANT SELECT ON public.festivals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.festivals TO authenticated;
GRANT ALL ON public.festivals TO service_role;

ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible festivals"
  ON public.festivals FOR SELECT
  USING (visible = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert festivals"
  ON public.festivals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update festivals"
  ON public.festivals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete festivals"
  ON public.festivals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER festivals_set_updated_at
  BEFORE UPDATE ON public.festivals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.festivals (name, festival_date, type, note, pooja_slug, pooja_label) VALUES
  ('Karwa Chauth', '2026-10-29', 'vrat', 'Fast for spouse''s longevity; moon-rise puja.', NULL, NULL),
  ('Dhanteras', '2026-11-06', 'major', 'Buy gold/silver; Lakshmi-Kuber pujan.', 'lakshmi-pooja', 'Lakshmi Pooja'),
  ('Diwali — Lakshmi Pujan', '2026-11-08', 'major', 'Main night of lights; Lakshmi-Ganesh pujan.', 'lakshmi-pooja', 'Lakshmi Pooja'),
  ('Govardhan Puja', '2026-11-10', 'major', 'Annakut; offerings to Krishna.', NULL, NULL),
  ('Bhai Dooj', '2026-11-11', 'major', 'Sister-brother bond; tilak ceremony.', NULL, NULL),
  ('Devutthani Ekadashi', '2026-11-19', 'ekadashi', 'Vishnu awakens; weddings begin.', NULL, NULL),
  ('Tulsi Vivah', '2026-11-21', 'major', 'Marriage of Tulsi and Vishnu.', NULL, NULL),
  ('Kartik Purnima', '2026-11-23', 'purnima', 'Holy bath, deep daan.', NULL, NULL),
  ('Margashirsha Amavasya', '2026-12-08', 'amavasya', 'Pitra tarpan day.', NULL, NULL),
  ('Geeta Jayanti', '2026-12-19', 'major', 'Birth of Bhagavad Gita.', NULL, NULL),
  ('Makar Sankranti', '2027-01-14', 'major', 'Sun enters Capricorn; til-gud daan.', NULL, NULL),
  ('Vasant Panchami', '2027-02-01', 'major', 'Saraswati Pujan.', 'saraswati-pooja', 'Saraswati Pooja'),
  ('Maha Shivratri', '2027-02-15', 'major', 'Night-long Shiva worship.', 'rudrabhishek', 'Rudrabhishek'),
  ('Holika Dahan', '2027-03-02', 'major', 'Bonfire on Phalguna Purnima.', NULL, NULL),
  ('Holi', '2027-03-03', 'major', 'Festival of colours.', NULL, NULL);
