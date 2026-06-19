# Pranam — Module Roadmap

The backend is built module-by-module. This is the agreed build order across
three phases. ✅ = implemented in this repo, ✅ = planned.

## 🔴 Phase 1 — MVP (build first)

| # | Module               | Status | Notes |
|---|----------------------|--------|-------|
| 1 | Auth                 | ✅     | Phone OTP, Google OAuth, JWT + refresh rotation |
| 2 | User                 | ✅     | Profile, addresses, NRI mode, credits ledger |
| 3 | Puja Catalog         | ✅     | 98 pujas, 14 categories, filtering, caching |
| 4 | Pandit               | ✅     | Profiles, availability slots, specializations |
| 5 | Booking              | ✅     | Slot booking, sankalp details |
| 6 | Kit & Inventory      | ✅     | Samagri kits, stock levels |
| 7 | Order                | ✅     | Order lifecycle, fulfilment |
| 8 | Cart                 | ✅     | Cart + checkout |
| 9 | Payment              | ✅     | Payment gateway, credits redemption (≤20% of order) |
| 10| Notification         | ✅     | FCM push, SMS, email |
| 11| Admin                | ✅     | Admin dashboards + controls |

## 🟡 Phase 2 — Growth (month 2–3)

| #  | Module                | Status | Notes |
|----|-----------------------|--------|-------|
| 12 | Video Session (Agora) | ✅     | Live puja video sessions |
| 13 | Astrology Chat        | ✅     | (frontend already has an encrypted chat stub) |
| 14 | Subscription          | ✅     | Recurring plans |
| 15 | Referral & Credits    | ✅     | Awards into the Module-2 credits ledger |
| 16 | Reviews & Ratings     | ✅     | Pandit + puja reviews |
| 17 | Festival & Muhurat    | ✅     | Auspicious timing calendar |
| 18 | Pandit Payout         | ✅     | Earnings + payouts |

## 🟢 Phase 3 — Scale

| #  | Module                  | Status | Notes |
|----|-------------------------|--------|-------|
| 19 | Search (Elasticsearch)  | ✅     | Full-text + faceted search |
| 20 | Analytics & Events      | ✅     | Event tracking pipeline |
| 21 | Recommendation Engine   | ✅     | Personalized puja/pandit recos |
| 22 | Report Generation       | ✅     | PDF Kundli + certificates |
| 23 | Support Ticket          | ✅     | Help desk / tickets |

## Notes on dependencies already laid down

- The **credits ledger** (`credit_transactions`) and `users.referred_by` are in
  place now, so the Phase-2 **Referral & Credits** module can plug straight in.
- `users.fcm_token` is captured now for the future **Notification** module.
- Address deletion has a guard hook (`isAddressInUse`) reserved for the **Order**
  module to prevent deleting an address tied to a pending order.
