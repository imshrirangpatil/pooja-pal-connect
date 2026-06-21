
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_referral_code(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_credit_balance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_credit_balance(uuid) TO authenticated;
