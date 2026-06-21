
-- 1. Profiles: referral fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);

-- 2. Code generator
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  exists_count int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.profiles WHERE referral_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$;

-- 3. Backfill existing profiles
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- 4. Update handle_new_user to assign referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url',
    public.generate_referral_code()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF NEW.email = 'chelsijain824@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Credits ledger
CREATE TABLE IF NOT EXISTS public.credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paise integer NOT NULL,
  kind text NOT NULL CHECK (kind IN ('referral_reward','referral_signup','promo','redeem','refund','adjustment')),
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credits_ledger_user_idx ON public.credits_ledger(user_id, created_at DESC);

GRANT SELECT ON public.credits_ledger TO authenticated;
GRANT ALL ON public.credits_ledger TO service_role;

ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits" ON public.credits_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 6. Balance helper
CREATE OR REPLACE FUNCTION public.get_credit_balance(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(amount_paise), 0)::int FROM public.credits_ledger WHERE user_id = _user_id;
$$;

-- 7. Apply referral code (called by referee post signup)
CREATE OR REPLACE FUNCTION public.apply_referral_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _referee uuid := auth.uid();
  _referrer uuid;
  _existing uuid;
  _referee_reward int := 5000;   -- ₹50 in paise
  _referrer_reward int := 10000; -- ₹100 in paise
BEGIN
  IF _referee IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT id INTO _referrer FROM public.profiles WHERE referral_code = upper(_code);
  IF _referrer IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid referral code');
  END IF;

  IF _referrer = _referee THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You cannot refer yourself');
  END IF;

  SELECT referred_by INTO _existing FROM public.profiles WHERE id = _referee;
  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Referral already applied');
  END IF;

  UPDATE public.profiles SET referred_by = _referrer WHERE id = _referee;

  INSERT INTO public.credits_ledger (user_id, amount_paise, kind, description, metadata)
  VALUES
    (_referee,  _referee_reward,  'referral_signup', 'Welcome bonus from referral', jsonb_build_object('referrer', _referrer)),
    (_referrer, _referrer_reward, 'referral_reward', 'Friend joined with your code', jsonb_build_object('referee',  _referee));

  RETURN jsonb_build_object(
    'ok', true,
    'referee_credits_paise', _referee_reward,
    'referrer_credits_paise', _referrer_reward
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_credit_balance(uuid) TO authenticated;
