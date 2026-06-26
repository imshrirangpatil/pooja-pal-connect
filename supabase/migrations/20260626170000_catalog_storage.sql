-- Public storage bucket for pooja and SKU images, uploaded by admins from the
-- catalog screens. Public read so the storefront can show them; writes are
-- restricted to admins. Idempotent so it is safe to re-run.

INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog', 'catalog', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read catalog" ON storage.objects;
CREATE POLICY "Public read catalog" ON storage.objects
  FOR SELECT USING (bucket_id = 'catalog');

DROP POLICY IF EXISTS "Admins upload catalog" ON storage.objects;
CREATE POLICY "Admins upload catalog" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update catalog" ON storage.objects;
CREATE POLICY "Admins update catalog" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete catalog" ON storage.objects;
CREATE POLICY "Admins delete catalog" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'));
