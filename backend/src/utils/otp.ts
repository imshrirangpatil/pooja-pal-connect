import crypto from 'crypto';

/** Cryptographically-random 6-digit OTP as a zero-padded string. */
export function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}
