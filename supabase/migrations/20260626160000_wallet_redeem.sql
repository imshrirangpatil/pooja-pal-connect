-- Spend Pranam credits at checkout. Credits live in credits_ledger (positive =
-- earned, negative = redeemed). Users cannot insert into the ledger directly, so
-- this SECURITY DEFINER function checks the balance and records the redemption.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS credits_applied INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.redeem_credits(_amount_paise INTEGER, _description TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE bal INTEGER;
BEGIN
  IF _amount_paise IS NULL OR _amount_paise <= 0 THEN
    RAISE EXCEPTION 'Invalid redeem amount';
  END IF;
  SELECT public.get_credit_balance(auth.uid()) INTO bal;
  IF bal < _amount_paise THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  INSERT INTO public.credits_ledger (user_id, amount_paise, kind, description)
  VALUES (auth.uid(), -_amount_paise, 'redeem', COALESCE(_description, 'Order payment'));
  RETURN bal - _amount_paise;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_credits(INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_credits(INTEGER, TEXT) TO authenticated;
