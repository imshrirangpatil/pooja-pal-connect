-- ============================================================================
-- PRANAM: run this once in the Supabase SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste all -> Run).
-- It is idempotent, so running it more than once is safe.
--
-- This unblocks:
--   * Pandit application document storage + admin viewing  (pandit-docs bucket)
--   * Pandit profile photos                                (pandit-photos bucket)
--   * Approved pandits showing on the pandits page         (photo_url column)
--   * Delivery + application status notifications
-- ============================================================================

-- ---------- Pandit portal + KYC document storage ----------------------------
ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS photo_url TEXT;
GRANT SELECT (photo_url) ON public.pandits TO anon, authenticated;

ALTER TABLE public.pandit_applications ADD COLUMN IF NOT EXISTS aadhaar_url TEXT;
ALTER TABLE public.pandit_applications ADD COLUMN IF NOT EXISTS credential_url TEXT;
ALTER TABLE public.pandit_applications ADD COLUMN IF NOT EXISTS selfie_url TEXT;

DROP POLICY IF EXISTS "Pandits read own row" ON public.pandits;
CREATE POLICY "Pandits read own row" ON public.pandits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Pandits update own row" ON public.pandits;
CREATE POLICY "Pandits update own row" ON public.pandits
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Private bucket: KYC documents. Applicants upload, only admins read them back.
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

-- Public bucket: pandit profile photos.
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

-- ---------- Delivery + application notifications ----------------------------
CREATE OR REPLACE FUNCTION public.notify_on_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order confirmed', 'Your order is confirmed and being packed.', '/orders');
    ELSIF NEW.status = 'shipped' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order shipped', 'Your samagri is on the way.', '/orders');
    ELSIF NEW.status = 'out_for_delivery' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Out for delivery', 'Your order is out for delivery and arrives soon.', '/orders');
    ELSIF NEW.status IN ('delivered', 'completed') THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order delivered', 'Your order is delivered. Pranam from all of us.', '/orders');
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order cancelled', 'Your order was cancelled. Reach support if this is unexpected.', '/orders');
    END IF;
  END IF;

  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'payment', 'Payment received', 'We have received your payment. Thank you.', '/orders');
  END IF;

  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_on_application_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id IS NOT NULL THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'application', 'Application approved',
              'Welcome aboard. Your pandit profile is now live on Pranam.', '/pandit');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'application', 'Application update',
              'We could not approve your application this time. Our team will reach out with details.', '/');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_notify_update ON public.pandit_applications;
CREATE TRIGGER applications_notify_update
  AFTER UPDATE ON public.pandit_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_update();
