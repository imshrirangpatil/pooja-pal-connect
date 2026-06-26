-- Support the full payout lifecycle so admins can review and advance requests:
-- requested -> processing -> paid, with reject/failed as terminal states.
-- The earlier values (pending, paid, failed) are kept for back compatibility.

ALTER TABLE public.pandit_payouts DROP CONSTRAINT IF EXISTS pandit_payouts_status_check;

ALTER TABLE public.pandit_payouts
  ADD CONSTRAINT pandit_payouts_status_check
  CHECK (status IN ('requested', 'pending', 'processing', 'paid', 'failed', 'rejected'));
