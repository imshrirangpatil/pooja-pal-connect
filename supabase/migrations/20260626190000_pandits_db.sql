-- Make pandits fully DB-backed and admin-manageable while keeping their stable
-- public ref (p1..p4) that reviews, saved-pandits and bookings are keyed on.

ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS ref TEXT;
ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS fee_from INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS pooja_slugs JSONB NOT NULL DEFAULT '[]'::jsonb;

-- These columns are not sensitive; allow public read (pandits use column-level grants).
GRANT SELECT (ref, bio, fee_from, pooja_slugs) ON public.pandits TO anon, authenticated;

UPDATE public.pandits SET ref = 'p1', fee_from = 2100,
  pooja_slugs = '["griha-pravesh","satyanarayan-katha","lakshmi-pooja"]'::jsonb,
  bio = 'Born into a lineage of Kashi acharyas, Ramesh Ji has performed 2,000+ ceremonies across India and abroad. Specialises in Griha Pravesh and Vivah sanskar.'
  WHERE name = 'Acharya Ramesh Shastri' AND ref IS NULL;

UPDATE public.pandits SET ref = 'p2', fee_from = 1499,
  pooja_slugs = '["ganesh-pooja","satyanarayan-katha","lakshmi-pooja"]'::jsonb,
  bio = 'Maharashtrian gurukul-trained acharya known for warm, family-friendly ceremonies. Fluent across Hindi, Marathi and Sanskrit.'
  WHERE name = 'Pandit Suresh Joshi' AND ref IS NULL;

UPDATE public.pandits SET ref = 'p3', fee_from = 1899,
  pooja_slugs = '["griha-pravesh","satyanarayan-katha"]'::jsonb,
  bio = 'South-Indian Smartha tradition. Expert in navagraha shanti, rudrabhishek and homam rituals.'
  WHERE name = 'Acharya Venkat Iyer' AND ref IS NULL;

UPDATE public.pandits SET ref = 'p4', fee_from = 1299,
  pooja_slugs = '["lakshmi-pooja","ganesh-pooja"]'::jsonb,
  bio = 'Young, energetic acharya from Mathura. Known for crisp shloka recitation and on-time arrivals.'
  WHERE name = 'Pandit Arjun Mishra' AND ref IS NULL;

-- Any other pandit (admin-added) gets a generated ref so the app always has a stable id.
UPDATE public.pandits SET ref = 'db-' || left(id::text, 8) WHERE ref IS NULL;
