-- Pooja bookings are stored as orders with booking details attached. pooja_slug
-- being set is what distinguishes a booking from a samagri order. Pandit and pooja
-- come from the static catalog (not DB rows), so we snapshot their names here.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pooja_slug TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pooja_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pandit_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pandit_ref TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS muhurat TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_user_booking ON public.orders(user_id, pooja_slug);

-- Let a user change only the status of their own order (so they can cancel).
GRANT UPDATE (status) ON public.orders TO authenticated;

CREATE POLICY "Users update own orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
