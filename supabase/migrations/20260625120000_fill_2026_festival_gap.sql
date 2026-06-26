-- Fill the mid-2026 festival gap so the home strip and festivals screen show the
-- correct upcoming events. Dates are from the 2026 Hindu panchang (Drik Panchang).
-- Each row is inserted only if a festival with the same name and date is absent,
-- so this migration is safe to run alongside the earlier seed.

INSERT INTO public.festivals (name, festival_date, type, note, pooja_slug, pooja_label)
SELECT v.name, v.festival_date::date, v.type, v.note, v.pooja_slug, v.pooja_label
FROM (VALUES
  ('Guru Purnima',            '2026-07-29', 'purnima', 'Honour your gurus; Vyasa Purnima.', NULL, NULL),
  ('Nag Panchami',            '2026-08-17', 'major',   'Worship of serpent deities.', NULL, NULL),
  ('Raksha Bandhan',          '2026-08-27', 'major',   'Rakhi; bond of brothers and sisters.', NULL, NULL),
  ('Krishna Janmashtami',     '2026-09-03', 'major',   'Birth of Lord Krishna; midnight puja.', NULL, NULL),
  ('Hartalika Teej',          '2026-09-13', 'vrat',    'Fast for marital well-being.', NULL, NULL),
  ('Ganesh Chaturthi',        '2026-09-14', 'major',   'Arrival of Lord Ganesha; 10-day festival.', 'ganesh-pooja', 'Ganesh Pooja'),
  ('Anant Chaturdashi',       '2026-09-25', 'major',   'Ganesh visarjan; Anant Vrat.', 'ganesh-pooja', 'Ganesh Pooja'),
  ('Sharad Navratri begins',  '2026-10-12', 'major',   'Ghatasthapana; nine nights of Durga.', NULL, NULL),
  ('Durga Ashtami',           '2026-10-19', 'major',   'Maha Ashtami; kanya pujan.', NULL, NULL),
  ('Vijayadashami (Dussehra)','2026-10-20', 'major',   'Victory of good over evil.', NULL, NULL)
) AS v(name, festival_date, type, note, pooja_slug, pooja_label)
WHERE NOT EXISTS (
  SELECT 1 FROM public.festivals f
  WHERE f.name = v.name AND f.festival_date = v.festival_date::date
);

-- Remove the em dash from the existing Diwali row to match the app writing style.
UPDATE public.festivals
SET name = 'Diwali (Lakshmi Pujan)'
WHERE name = 'Diwali — Lakshmi Pujan';
