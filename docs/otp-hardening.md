# OTP hardening review

Pranam uses Supabase phone OTP (`signInWithOtp` / `verifyOtp`) through `src/lib/auth.tsx`.
The hard security controls (expiry, rate limits, lockout) live in Supabase, not in app
code. This note records what the app now does and what you must set in Supabase.

## Done in the app (client side)

`src/routes/signup.tsx`:
- Resend is throttled with a 30 second cooldown so a code cannot be requested in a burst.
- Wrong attempts are counted. After 5 wrong tries the user is told to request a fresh code.
- The OTP boxes accept a pasted code and support the `one-time-code` autofill hint.
- Clear messaging that the code expires and can be resent.

These are convenience and abuse-slowing measures. They are not a substitute for the
server-side limits below, which a determined client could otherwise bypass.

## Configure in Supabase (server side, required)

In the Supabase dashboard for project `lhiojfhzyaladdgcbsak`:

1. Authentication > Providers > Phone
   - Set OTP expiry to a short window (300 to 600 seconds).
   - OTP length 6.
2. Authentication > Rate Limits
   - Cap "SMS OTP sent per hour" per number (for example 3 to 5).
   - Cap verification attempts to lock out repeated wrong codes.
3. Use a real SMS provider (Twilio, MSG91) with sending caps, and enable any
   provider-side fraud or geo limits.
4. Keep an eye on the SMS spend dashboard. OTP abuse usually shows up as a cost spike.

## Note on the standalone backend

`backend/` already implements Redis-backed OTP rate limiting and lockout
(`OTP_MAX_REQUESTS_PER_HOUR`, `OTP_MAX_WRONG_ATTEMPTS`, `OTP_LOCK_SECONDS`). The live app
does not use that backend; it uses Supabase. If you later move auth to that backend,
those controls apply instead of the Supabase settings above.
