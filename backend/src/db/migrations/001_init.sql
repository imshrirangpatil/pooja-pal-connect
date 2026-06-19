-- =====================================================================
-- Pranam backend — Module 1 (Auth) + Module 2 (User) schema
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- for gen_random_uuid()

-- updated_at trigger function (shared)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(15) UNIQUE,                 -- nullable if Google-only
  email           VARCHAR(255) UNIQUE,                -- nullable if phone-only
  google_id       VARCHAR(255) UNIQUE,                -- from Google OAuth
  name            VARCHAR(100) NOT NULL DEFAULT '',
  photo_url       TEXT,
  role            VARCHAR(20) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user','pandit','admin')),
  referral_code   VARCHAR(20) NOT NULL UNIQUE,
  referred_by     UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Module 2 (User) columns
  gotra           VARCHAR(100),
  city            VARCHAR(100),
  country         VARCHAR(100) NOT NULL DEFAULT 'IN',
  currency        VARCHAR(5) NOT NULL DEFAULT 'INR'
                    CHECK (currency IN ('INR','USD','GBP','AED')),
  is_nri          BOOLEAN NOT NULL DEFAULT false,
  credits_balance INTEGER NOT NULL DEFAULT 0          -- paise; never negative
                    CHECK (credits_balance >= 0),
  fcm_token       TEXT,

  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_phone     ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- addresses
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(50) NOT NULL DEFAULT 'Home',
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        VARCHAR(100) NOT NULL,
  state       VARCHAR(100) NOT NULL,
  pincode     VARCHAR(10) NOT NULL,
  country     VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- At most ONE default address per user (enforced at the DB level).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_default_address_per_user
  ON addresses(user_id) WHERE is_default;

-- ─────────────────────────────────────────────────────────────────────
-- credit_transactions  (immutable ledger; every balance change is logged)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('earned','redeemed','refunded')),
  amount        INTEGER NOT NULL CHECK (amount > 0),   -- paise, always positive
  source        VARCHAR(50) NOT NULL CHECK (source IN ('referral','order_refund','promotion')),
  reference_id  UUID,                                   -- referral id or order id
  description   TEXT,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user
  ON credit_transactions(user_id, created_at DESC);
