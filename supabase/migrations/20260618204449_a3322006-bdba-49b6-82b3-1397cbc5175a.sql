
-- 1. Grant admin to specific email if user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'chelsijain824@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Update handle_new_user trigger to grant admin to that email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url'
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
$function$;

-- 3. Poojas catalog
CREATE TABLE public.poojas (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  price_from INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  popular BOOLEAN NOT NULL DEFAULT false,
  season TEXT,
  description TEXT NOT NULL DEFAULT '',
  includes JSONB NOT NULL DEFAULT '[]'::jsonb,
  samagri_included BOOLEAN NOT NULL DEFAULT true,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.poojas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.poojas TO authenticated;
GRANT ALL ON public.poojas TO service_role;

ALTER TABLE public.poojas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poojas are viewable by everyone" ON public.poojas FOR SELECT USING (true);
CREATE POLICY "Admins can insert poojas" ON public.poojas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update poojas" ON public.poojas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete poojas" ON public.poojas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_poojas_updated_at BEFORE UPDATE ON public.poojas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Pandits catalog
CREATE TABLE public.pandits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  experience INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  reviews INTEGER NOT NULL DEFAULT 0,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT true,
  initials TEXT NOT NULL DEFAULT '',
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pandits TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pandits TO authenticated;
GRANT ALL ON public.pandits TO service_role;

ALTER TABLE public.pandits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pandits are viewable by everyone" ON public.pandits FOR SELECT USING (true);
CREATE POLICY "Admins can insert pandits" ON public.pandits FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update pandits" ON public.pandits FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete pandits" ON public.pandits FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_pandits_updated_at BEFORE UPDATE ON public.pandits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Pandit applications
CREATE TABLE public.pandit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  experience INTEGER NOT NULL DEFAULT 0,
  languages TEXT NOT NULL DEFAULT '',
  specialties TEXT NOT NULL DEFAULT '',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.pandit_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.pandit_applications TO authenticated;
GRANT ALL ON public.pandit_applications TO service_role;

ALTER TABLE public.pandit_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a pandit application" ON public.pandit_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view applications" ON public.pandit_applications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update applications" ON public.pandit_applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete applications" ON public.pandit_applications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_pandit_applications_updated_at BEFORE UPDATE ON public.pandit_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Admin policies on existing tables
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all order_items" ON public.order_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- profiles already has admin select policy per security memory; ensure it exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can view all profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Seed catalog from existing static data
INSERT INTO public.poojas (slug, name, tagline, duration, price_from, popular, season, description, includes) VALUES
  ('ganesh-pooja', 'Ganesh Pooja', 'Remover of obstacles, new beginnings', '1.5 hrs', 1499, true, 'Ganesh Chaturthi', 'Invoke Lord Ganesha for auspicious beginnings — ideal before new ventures, exams, or any important event.', '["Verified Pandit Ji","Full samagri kit","Sankalp & aarti","Prasad blessing"]'::jsonb),
  ('satyanarayan-katha', 'Satyanarayan Katha', 'Family prosperity & gratitude', '2 hrs', 2199, true, NULL, 'Traditional katha for family well-being, performed on Purnima or any auspicious day.', '["Verified Pandit Ji","Full samagri kit","Katha recitation","Prasad for 11 people"]'::jsonb),
  ('griha-pravesh', 'Griha Pravesh', 'Sanctify your new home', '3 hrs', 4999, false, 'Akshaya Tritiya', 'Vaastu shanti and house-warming ceremony with kalash sthapana, navagraha shanti and havan.', '["2 Verified Pandit Jis","Premium samagri kit","Vaastu shanti","Havan & purnahuti"]'::jsonb),
  ('lakshmi-pooja', 'Lakshmi Pooja', 'Wealth, abundance & light', '1.5 hrs', 1799, true, 'Diwali', 'Welcome Maa Lakshmi into your home with the traditional Diwali night ceremony.', '["Verified Pandit Ji","Diwali samagri kit","Lakshmi aarti","Silver coin blessing"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pandits (name, city, experience, rating, reviews, languages, specialties, initials) VALUES
  ('Acharya Ramesh Shastri', 'Varanasi', 22, 4.9, 412, '["Hindi","Sanskrit","English"]'::jsonb, '["Griha Pravesh","Vivah"]'::jsonb, 'RS'),
  ('Pandit Suresh Joshi', 'Mumbai', 15, 4.8, 287, '["Hindi","Marathi","Sanskrit"]'::jsonb, '["Ganesh Pooja","Satyanarayan"]'::jsonb, 'SJ'),
  ('Acharya Venkat Iyer', 'Bengaluru', 18, 4.9, 356, '["Tamil","Kannada","Sanskrit"]'::jsonb, '["Navagraha","Rudrabhishek"]'::jsonb, 'VI'),
  ('Pandit Arjun Mishra', 'Delhi NCR', 12, 4.7, 198, '["Hindi","Sanskrit"]'::jsonb, '["Lakshmi Pooja","Havan"]'::jsonb, 'AM');
