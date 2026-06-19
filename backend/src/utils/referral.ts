import crypto from 'crypto';
import { query } from '../config/db';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O/1/I)
const PREFIX = 'PRANAM';

function randomSuffix(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return out;
}

/**
 * Generate a unique referral code. Format: 8 alphanumeric chars.
 * We keep a readable PRANAM-ish flavour but stay within VARCHAR(20).
 * Retries on the (rare) collision against users.referral_code.
 */
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomSuffix(8); // e.g. "PRQ4XK9M"
    const { rowCount } = await query(
      'SELECT 1 FROM users WHERE referral_code = $1',
      [code],
    );
    if (rowCount === 0) return code;
  }
  // Extremely unlikely fallback: prefix + time-based suffix.
  return `${PREFIX}${randomSuffix(6)}`.slice(0, 20);
}
