-- Pandit portal + real KYC document upload.
--   * link a pandit row to the auth account that owns it (the portal),
--   * a profile photo for the pandit,
--   * store uploaded KYC document paths on the application,
--   * a private bucket for KYC docs and a public one for profile photos.
-- Idempotent so it is safe to re-run.

ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS photo_url TEXT;
GRANT SELECT (photo_url) ON public.pandits TO anon, authenticated;

ALTER TABLE public.pandit_applications ADD COLUMN IF NOT EXISTS aadhaar_url TEXT;
ALTER TABLE public.pandit_applications ADD COLUMN IF NOT EXISTS credential_url TEXT;
ALTER TABLE public.pandit_applications ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- Let a pandit read and update their own linked row through the portal.
DROP POLICY IF EXISTS "Pandits read own row" ON public.pandits;
CREATE POLICY "Pandits read own row" ON public.pandits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Pandits update own row" ON public.pandits;
CREATE POLICY "Pandits update own row" ON public.pandits
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Private bucket: KYC documents. Applicants (signed in or not) can upload,
-- only admins can read them back.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pandit-docs', 'pandit-docs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Applicants upload kyc" ON storage.objects;
CREATE POLICY "Applicants upload kyc" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'pandit-docs');

DROP POLICY IF EXISTS "Admins read kyc" ON storage.objects;
CREATE POLICY "Admins read kyc" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pandit-docs' AND public.has_role(auth.uid(), 'admin'));

-- Public bucket: pandit profile photos, shown on the pandits page.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pandit-photos', 'pandit-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read pandit photos" ON storage.objects;
CREATE POLICY "Public read pandit photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'pandit-photos');

DROP POLICY IF EXISTS "Pandits upload own photo" ON storage.objects;
CREATE POLICY "Pandits upload own photo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pandit-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Pandits update own photo" ON storage.objects;
CREATE POLICY "Pandits update own photo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'pandit-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
