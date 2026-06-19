# Pranam Backend

Standalone backend service for the Pranam app. Built per the module spec as a
**Node.js + Express + PostgreSQL + Redis** API in TypeScript. It runs
independently of the Lovable/Supabase frontend in this repo.

This service currently implements **Phase 1 modules 1 & 2**:

- **Module 1 — Auth**: phone OTP login, Google OAuth, JWT access tokens,
  opaque refresh tokens with rotation + blacklist, multi-device sessions,
  referral-code generation.
- **Module 2 — User**: profile CRUD, delivery addresses (with default-address
  rules), NRI mode + currency, and the credits ledger.

## Stack

| Concern        | Choice                                    |
|----------------|-------------------------------------------|
| Runtime        | Node.js + Express 4 (TypeScript)          |
| Database       | PostgreSQL (`pg`)                         |
| Cache / tokens | Redis (`ioredis`)                         |
| Auth tokens    | `jsonwebtoken` (access), UUID (refresh)   |
| SMS OTP        | MSG91                                     |
| Social login   | `google-auth-library`                     |
| Validation     | `zod`                                     |

## Getting started

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, REDIS_URL, secrets
npm install
npm run migrate             # create tables
npm run dev                 # start on http://localhost:4000
```

You need a local PostgreSQL and Redis running (or point the URLs at hosted
instances). With `SMS_DRY_RUN=true` (the default), OTPs are printed to the
console instead of being sent, so you can test the flow without MSG91.

## Scripts

- `npm run dev` — hot-reloading dev server (tsx)
- `npm run build` — compile to `dist/`
- `npm start` — run the compiled server
- `npm run typecheck` — `tsc --noEmit`
- `npm run migrate` — apply SQL migrations in `src/db/migrations`

## Environment

See `.env.example` for the full list. Key values:

- `JWT_ACCESS_SECRET` — sign access tokens (15-min TTL)
- `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` — token lifetimes (seconds)
- `OTP_*` — OTP TTL, per-hour request cap, wrong-attempt cap, lockout window
- `GOOGLE_CLIENT_ID`, `MSG91_*`, `FX_*`

## API

### Auth (`/auth`)

| Method | Endpoint            | Auth | Description                         |
|--------|---------------------|------|-------------------------------------|
| POST   | `/auth/send-otp`    | No   | Send OTP to a phone number          |
| POST   | `/auth/verify-otp`  | No   | Verify OTP → tokens + user          |
| POST   | `/auth/google`      | No   | Google OAuth login                  |
| POST   | `/auth/refresh`     | No*  | Rotate refresh token, new access    |
| POST   | `/auth/logout`      | Yes  | Revoke current session              |
| GET    | `/auth/me`          | Yes  | Current user (same shape as `/users/me`) |

\* `/auth/refresh` reads the refresh token from an httpOnly cookie (web) or the
request body (mobile).

### Users (`/users`) — all require `Authorization: Bearer <access_token>`

| Method | Endpoint                          | Description                       |
|--------|-----------------------------------|-----------------------------------|
| GET    | `/users/me`                       | Profile + default address         |
| PUT    | `/users/me`                       | Update name/email/photo/gotra/city|
| PUT    | `/users/me/fcm-token`             | Update push token                 |
| PUT    | `/users/me/nri-mode`              | Toggle NRI + set currency         |
| GET    | `/users/me/addresses`             | List addresses                    |
| POST   | `/users/me/addresses`             | Add address                       |
| PUT    | `/users/me/addresses/:id`         | Edit address                      |
| DELETE | `/users/me/addresses/:id`         | Delete address                    |
| PUT    | `/users/me/addresses/:id/default` | Set default address               |
| GET    | `/users/me/credits`               | Balance + transaction history     |

### Error shape

```json
{ "error": "OTP_EXPIRED", "message": "OTP expired, request a new one." }
```

## Token model

- **Access token**: JWT `{ userId, role }`, 15-min expiry, sent as
  `Authorization: Bearer <token>`.
- **Refresh token**: opaque UUID stored in Redis. `SESSION:{userId}` is a SET of
  a user's active refresh tokens (multi-device). On refresh the old token is
  rotated out and blacklisted until natural expiry.

## Project layout

```
backend/src
├── config/        env, pg pool, redis client + key builders
├── db/            SQL migrations + runner
├── middleware/    auth, role, rate-limit, error handler
├── services/      MSG91 SMS, Google token verify
├── utils/         jwt, tokens, otp, referral, currency, validators, errors
└── modules/
    ├── auth/      service · controller · routes
    └── users/     service · addresses · controller · routes
```

See `ROADMAP.md` for the full phased module plan.

---

## All modules (23) — now implemented

This service now contains every module across the three phases. Modules 1–2
were built from detailed specs; modules 3–23 follow the same architecture with
sensible defaults and clearly-marked stubs where an external integration or an
undefined business rule applies (search for `TODO(` in the source).

### Route map

| Prefix             | Module                | Notes |
|--------------------|-----------------------|-------|
| `/auth`            | Auth                  | OTP, Google, JWT/refresh |
| `/users`           | User                  | profile, addresses, NRI, credits |
| `/poojas`          | Puja Catalog          | list/filter/search, categories, admin upsert |
| `/pandits`         | Pandit                | profiles, availability slots |
| `/bookings`        | Booking               | sankalp, slot reservation, lifecycle |
| `/kits`            | Kit & Inventory       | kits, items, stock (admin) |
| `/cart`            | Cart                  | add/update/remove/clear |
| `/orders`          | Order                 | build from cart, credits ≤20%, lifecycle |
| `/payments`        | Payment               | gateway stub, initiate/confirm |
| `/notifications`   | Notification          | in-app feed; push/email stubs |
| `/admin`           | Admin                 | dashboard, users, roles, credits, orders |
| `/video`           | Video Session (Agora) | session + RTC token stub |
| `/astro`           | Astrology Chat        | sessions, messages, billing |
| `/subscriptions`   | Subscription          | plans, subscribe, cancel |
| `/referrals`       | Referral & Credits    | apply code → rewards ledger |
| `/reviews`         | Reviews & Ratings     | upsert review, pandit rating rollup |
| `/festivals`       | Festival & Muhurat    | upcoming festivals + muhurats |
| `/payouts`         | Pandit Payout         | earnings, request, admin process |
| `/search`          | Search                | Postgres FTS (Elasticsearch later) |
| `/analytics`       | Analytics & Events    | event ingest + admin summary |
| `/recommendations` | Recommendation Engine | history/popularity based |
| `/reports`         | Report Generation     | queue Kundli/certificate (PDF worker stub) |
| `/support`         | Support Ticket        | tickets + threaded messages |

### Integration points still requiring real credentials/services

- **Payment** (`src/services/payment-gateway.ts`) — wire Razorpay/Stripe SDK + signature verify.
- **Video** (`src/services/agora.ts`) — real Agora `RtcTokenBuilder`.
- **Notifications** (`src/services/push.ts`) — Firebase Admin + email provider.
- **SMS** (`src/services/sms.ts`) — live MSG91 (works in dry-run today).
- **Search** — optional Elasticsearch cluster.
- **Reports** — async PDF worker + object storage for `file_url`.

Run `npm run migrate` to apply both migrations (`001_init.sql`, `002_modules.sql`).
