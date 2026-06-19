-- =====================================================================
-- Pranam backend — Phase 1/2/3 module tables (modules 3–23)
-- =====================================================================

-- ── Module 3: Puja Catalog ───────────────────────────────
CREATE TABLE IF NOT EXISTS pooja_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       VARCHAR(80) UNIQUE NOT NULL,
  name       VARCHAR(120) NOT NULL,
  icon_url   TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poojas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(120) UNIQUE NOT NULL,
  title         VARCHAR(200) NOT NULL,
  category_id   UUID REFERENCES pooja_categories(id) ON DELETE SET NULL,
  description   TEXT,
  benefits      TEXT,
  duration_mins INTEGER,
  base_price    INTEGER NOT NULL DEFAULT 0,   -- paise
  image_url     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  search_tsv    tsvector,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_poojas_category ON poojas(category_id);
CREATE INDEX IF NOT EXISTS idx_poojas_active   ON poojas(is_active);
CREATE INDEX IF NOT EXISTS idx_poojas_tsv      ON poojas USING gin(search_tsv);
DROP TRIGGER IF EXISTS trg_poojas_updated_at ON poojas;
CREATE TRIGGER trg_poojas_updated_at BEFORE UPDATE ON poojas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- keep the full-text vector in sync
CREATE OR REPLACE FUNCTION poojas_tsv_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.benefits,'')), 'C');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_poojas_tsv ON poojas;
CREATE TRIGGER trg_poojas_tsv BEFORE INSERT OR UPDATE ON poojas
  FOR EACH ROW EXECUTE FUNCTION poojas_tsv_update();

-- ── Module 4: Pandit ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS pandits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name            VARCHAR(120) NOT NULL,
  bio             TEXT,
  photo_url       TEXT,
  city            VARCHAR(100),
  languages       TEXT[] NOT NULL DEFAULT '{}',
  specializations TEXT[] NOT NULL DEFAULT '{}',
  experience_yrs  INTEGER NOT NULL DEFAULT 0,
  rating_avg      NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pandits_city ON pandits(city);
DROP TRIGGER IF EXISTS trg_pandits_updated_at ON pandits;
CREATE TRIGGER trg_pandits_updated_at BEFORE UPDATE ON pandits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS pandit_availability (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pandit_id  UUID NOT NULL REFERENCES pandits(id) ON DELETE CASCADE,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end   TIMESTAMPTZ NOT NULL,
  is_booked  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pandit_id, slot_start)
);
CREATE INDEX IF NOT EXISTS idx_avail_pandit ON pandit_availability(pandit_id, slot_start);

-- ── Module 5: Booking ────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pooja_id      UUID REFERENCES poojas(id) ON DELETE SET NULL,
  pandit_id     UUID REFERENCES pandits(id) ON DELETE SET NULL,
  slot_id       UUID REFERENCES pandit_availability(id) ON DELETE SET NULL,
  scheduled_at  TIMESTAMPTZ,
  -- sankalp details
  sankalp_name  VARCHAR(120),
  gotra         VARCHAR(100),
  nakshatra     VARCHAR(100),
  notes         TEXT,
  amount        INTEGER NOT NULL DEFAULT 0,  -- paise
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_pandit ON bookings(pandit_id);
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Module 6: Kit & Inventory ────────────────────────────
CREATE TABLE IF NOT EXISTS kits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(120) UNIQUE NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  price       INTEGER NOT NULL DEFAULT 0,  -- paise
  image_url   TEXT,
  pooja_id    UUID REFERENCES poojas(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_kits_updated_at ON kits;
CREATE TRIGGER trg_kits_updated_at BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS kit_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id    UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  name      VARCHAR(160) NOT NULL,
  quantity  VARCHAR(60) NOT NULL DEFAULT '1'
);
CREATE INDEX IF NOT EXISTS idx_kit_items_kit ON kit_items(kit_id);

CREATE TABLE IF NOT EXISTS inventory (
  kit_id      UUID PRIMARY KEY REFERENCES kits(id) ON DELETE CASCADE,
  stock_qty   INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory;
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Module 8: Cart ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type   VARCHAR(20) NOT NULL CHECK (item_type IN ('kit','pooja')),
  item_id     UUID NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
DROP TRIGGER IF EXISTS trg_cart_updated_at ON cart_items;
CREATE TRIGGER trg_cart_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Module 7: Order ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id      UUID REFERENCES addresses(id) ON DELETE SET NULL,
  subtotal        INTEGER NOT NULL DEFAULT 0,   -- paise
  credits_applied INTEGER NOT NULL DEFAULT 0,   -- paise
  total           INTEGER NOT NULL DEFAULT 0,   -- paise
  status          VARCHAR(20) NOT NULL DEFAULT 'created'
                    CHECK (status IN ('created','paid','packed','shipped','delivered','cancelled','refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type  VARCHAR(20) NOT NULL CHECK (item_type IN ('kit','pooja')),
  item_id    UUID NOT NULL,
  title      VARCHAR(200) NOT NULL,
  unit_price INTEGER NOT NULL,  -- paise
  quantity   INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ── Module 9: Payment ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gateway         VARCHAR(30) NOT NULL DEFAULT 'razorpay',
  gateway_ref     VARCHAR(120),
  amount          INTEGER NOT NULL,  -- paise
  currency        VARCHAR(5) NOT NULL DEFAULT 'INR',
  status          VARCHAR(20) NOT NULL DEFAULT 'created'
                    CHECK (status IN ('created','authorized','captured','failed','refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Module 10: Notification ──────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel    VARCHAR(20) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app','push','sms','email')),
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- ── Module 14: Subscription ──────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(80) UNIQUE NOT NULL,
  name         VARCHAR(120) NOT NULL,
  price        INTEGER NOT NULL DEFAULT 0,  -- paise
  interval     VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly','quarterly','yearly')),
  benefits     TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id      UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
DROP TRIGGER IF EXISTS trg_subs_updated_at ON subscriptions;
CREATE TRIGGER trg_subs_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Module 15: Referral ──────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code         VARCHAR(20) NOT NULL,
  reward_paise INTEGER NOT NULL DEFAULT 10000,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rewarded')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referee_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- ── Module 16: Reviews & Ratings ─────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type  VARCHAR(20) NOT NULL CHECK (target_type IN ('pandit','pooja')),
  target_id    UUID NOT NULL,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);

-- ── Module 17: Festival & Muhurat ────────────────────────
CREATE TABLE IF NOT EXISTS festivals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(160) NOT NULL,
  date        DATE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_festivals_date ON festivals(date);
CREATE TABLE IF NOT EXISTS muhurats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(160) NOT NULL,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  kind         VARCHAR(60),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_muhurats_start ON muhurats(starts_at);

-- ── Module 18: Pandit Payout ─────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pandit_id    UUID NOT NULL REFERENCES pandits(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL CHECK (amount > 0),  -- paise
  status       VARCHAR(20) NOT NULL DEFAULT 'requested'
                 CHECK (status IN ('requested','processing','paid','rejected')),
  reference    VARCHAR(120),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payouts_pandit ON payouts(pandit_id, created_at DESC);
DROP TRIGGER IF EXISTS trg_payouts_updated_at ON payouts;
CREATE TRIGGER trg_payouts_updated_at BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Module 12: Video Session ─────────────────────────────
CREATE TABLE IF NOT EXISTS video_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pandit_id    UUID REFERENCES pandits(id) ON DELETE SET NULL,
  channel_name VARCHAR(120) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN ('created','live','ended')),
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_video_user ON video_sessions(user_id);

-- ── Module 13: Astrology Chat ────────────────────────────
CREATE TABLE IF NOT EXISTS astro_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  astrologer_id  VARCHAR(80) NOT NULL,
  astrologer_name VARCHAR(120) NOT NULL,
  price_per_min  INTEGER NOT NULL DEFAULT 0,
  status         VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  seconds_elapsed INTEGER NOT NULL DEFAULT 0,
  billed_amount  INTEGER NOT NULL DEFAULT 0,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS astro_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES astro_sessions(id) ON DELETE CASCADE,
  sender      VARCHAR(20) NOT NULL CHECK (sender IN ('user','astrologer','system')),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_astro_msg_session ON astro_messages(session_id, created_at);

-- ── Module 20: Analytics & Events ────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  name        VARCHAR(120) NOT NULL,
  props       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name, created_at DESC);

-- ── Module 22: Report Generation ─────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        VARCHAR(30) NOT NULL CHECK (kind IN ('kundli','certificate')),
  status      VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','ready','failed')),
  params      JSONB,
  file_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id, created_at DESC);
DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Module 23: Support Ticket ────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject     VARCHAR(200) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','resolved','closed')),
  priority    VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id, created_at DESC);
DROP TRIGGER IF EXISTS trg_tickets_updated_at ON support_tickets;
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  is_staff    BOOLEAN NOT NULL DEFAULT false,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_msg ON ticket_messages(ticket_id, created_at);
