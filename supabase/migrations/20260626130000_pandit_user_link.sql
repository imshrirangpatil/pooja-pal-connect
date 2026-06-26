-- Link a pandit profile to a user account so the pandit can see their earnings and
-- request payouts. Admin sets this link from the pandit detail screen.

ALTER TABLE public.pandits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pandits_user ON public.pandits(user_id);

-- user_id is not sensitive; let signed-in users read it so a pandit can find their
-- own profile. (Bank columns stay restricted by the earlier column-level grants.)
GRANT SELECT (user_id) ON public.pandits TO authenticated;

-- A linked pandit can see the orders assigned to them (for earnings).
CREATE POLICY "Pandit views assigned orders" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pandits p WHERE p.id = orders.pandit_id AND p.user_id = auth.uid()));

-- A linked pandit can see their own payouts and raise a payout request.
CREATE POLICY "Pandit views own payouts" ON public.pandit_payouts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pandits p WHERE p.id = pandit_payouts.pandit_id AND p.user_id = auth.uid()));

CREATE POLICY "Pandit requests payout" ON public.pandit_payouts
  FOR INSERT TO authenticated
  WITH CHECK (
    status = 'requested'
    AND EXISTS (SELECT 1 FROM public.pandits p WHERE p.id = pandit_payouts.pandit_id AND p.user_id = auth.uid())
  );
