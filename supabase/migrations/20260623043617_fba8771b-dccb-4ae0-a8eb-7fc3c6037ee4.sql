
-- 1. Pandits: restrict bank columns by column-level grants
REVOKE SELECT ON public.pandits FROM anon, authenticated;
GRANT SELECT (id, name, city, experience, rating, reviews, languages, specialties, verified, initials, visible, created_at, updated_at)
  ON public.pandits TO anon, authenticated;
-- service_role keeps full access for admin paths

-- 2. Reviews: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Reviews are readable by signed-in users"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

-- 3. Tighten always-true INSERT policies
DROP POLICY IF EXISTS "Anyone can submit a pandit application" ON public.pandit_applications;
CREATE POLICY "Submit pandit application"
  ON public.pandit_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Anyone can create a ticket" ON public.support_tickets;
CREATE POLICY "Create support ticket"
  ON public.support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  );

-- 4. Revoke SECURITY DEFINER function EXECUTE from anon and PUBLIC
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_credit_balance(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_referral_code(text) FROM anon, PUBLIC;
-- authenticated retains EXECUTE because these are intentional signed-in RPCs
