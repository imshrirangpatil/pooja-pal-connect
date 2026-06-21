-- 1) Bank/UPI fields on pandit_applications
ALTER TABLE public.pandit_applications
  ADD COLUMN IF NOT EXISTS account_holder text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS ifsc text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS upi_id text;

-- 2) Bank/UPI fields on pandits
ALTER TABLE public.pandits
  ADD COLUMN IF NOT EXISTS account_holder text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS ifsc text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS upi_id text;

-- 3) Optional pandit link on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pandit_id uuid REFERENCES public.pandits(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_pandit ON public.orders(pandit_id);

-- 4) Payouts table
CREATE TABLE IF NOT EXISTS public.pandit_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pandit_id uuid NOT NULL REFERENCES public.pandits(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  method text NOT NULL DEFAULT 'upi' CHECK (method IN ('upi','bank')),
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('pending','paid','failed')),
  reference text,
  notes text,
  paid_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pandit_payouts TO authenticated;
GRANT ALL ON public.pandit_payouts TO service_role;

ALTER TABLE public.pandit_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view payouts" ON public.pandit_payouts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create payouts" ON public.pandit_payouts
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update payouts" ON public.pandit_payouts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete payouts" ON public.pandit_payouts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_payouts_pandit ON public.pandit_payouts(pandit_id, created_at DESC);

CREATE TRIGGER set_pandit_payouts_updated_at
  BEFORE UPDATE ON public.pandit_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();