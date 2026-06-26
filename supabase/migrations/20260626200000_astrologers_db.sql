-- Astrologers were static-only. This adds a DB table (admin-manageable) with a
-- stable public ref (a1..a4) that astro chat sessions and reviews are keyed on.

CREATE TABLE IF NOT EXISTS public.astrologers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  expertise TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Vedic',
  experience INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  price_per_min INTEGER NOT NULL DEFAULT 0,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  online BOOLEAN NOT NULL DEFAULT true,
  initials TEXT NOT NULL DEFAULT '',
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.astrologers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.astrologers TO authenticated;
GRANT ALL ON public.astrologers TO service_role;

ALTER TABLE public.astrologers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Astrologers viewable by everyone" ON public.astrologers
  FOR SELECT USING (visible = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert astrologers" ON public.astrologers
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update astrologers" ON public.astrologers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete astrologers" ON public.astrologers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER astrologers_set_updated_at
  BEFORE UPDATE ON public.astrologers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.astrologers (ref, name, expertise, category, experience, rating, price_per_min, languages, online, initials, sort_order) VALUES
  ('a1', 'Acharya Mohan Tripathi', 'Vedic & Kundli', 'Vedic', 25, 4.9, 35, '["Hindi","English"]'::jsonb, true, 'MT', 0),
  ('a2', 'Smriti Sharma', 'Tarot & Numerology', 'Tarot', 10, 4.8, 22, '["Hindi","English"]'::jsonb, true, 'SS', 1),
  ('a3', 'Pandit Rajesh Bhatt', 'Vastu & Palmistry', 'Vastu', 18, 4.7, 28, '["Hindi","Gujarati"]'::jsonb, false, 'RB', 2),
  ('a4', 'Dr. Priya Nair', 'Nadi & Prashna', 'Nadi', 14, 4.9, 40, '["English","Malayalam"]'::jsonb, true, 'PN', 3)
ON CONFLICT (ref) DO NOTHING;
