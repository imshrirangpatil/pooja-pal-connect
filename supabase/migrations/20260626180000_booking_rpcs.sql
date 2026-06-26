-- Two helpers for the booking flow:
--   refund_order_credits: returns Pranam credits to the wallet when an order/booking
--     that used them is cancelled. Idempotent (zeroes credits_applied after refund).
--   is_pandit_available: server-side check that a pandit has no other live booking at
--     the same time (RLS would otherwise hide other users' bookings from the client).

CREATE OR REPLACE FUNCTION public.refund_order_credits(_order_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE applied INTEGER; uid UUID;
BEGIN
  SELECT credits_applied, user_id INTO applied, uid FROM public.orders WHERE id = _order_id;
  IF uid IS NULL OR uid <> auth.uid() THEN
    RAISE EXCEPTION 'Not your order';
  END IF;
  IF applied IS NULL OR applied <= 0 THEN
    RETURN 0;
  END IF;
  INSERT INTO public.credits_ledger (user_id, amount_paise, kind, description)
  VALUES (uid, applied, 'refund', 'Refund for cancelled order ' || _order_id);
  UPDATE public.orders SET credits_applied = 0 WHERE id = _order_id;
  RETURN applied;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_order_credits(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_order_credits(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_pandit_available(_pandit_id UUID, _scheduled_at TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.orders
    WHERE pandit_id = _pandit_id
      AND scheduled_at = _scheduled_at
      AND status <> 'cancelled'
      AND pooja_slug IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_pandit_available(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pandit_available(UUID, TIMESTAMPTZ) TO authenticated;
