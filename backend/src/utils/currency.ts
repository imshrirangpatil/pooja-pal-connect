import axios from 'axios';
import { redis, keys } from '../config/redis';
import { env } from '../config/env';

export type Currency = 'INR' | 'USD' | 'GBP' | 'AED';
export const SUPPORTED_CURRENCIES: Currency[] = ['INR', 'USD', 'GBP', 'AED'];

interface RateTable {
  base: 'INR';
  rates: Record<string, number>;
  fetchedAt: number;
}

/**
 * Fetch INR->* rates, cached in Redis for 6h (FX_CACHE_TTL).
 * Falls back to a static table if the upstream API is unreachable.
 */
async function getRates(): Promise<RateTable> {
  const cached = await redis.get(keys.fxRates());
  if (cached) {
    try {
      return JSON.parse(cached) as RateTable;
    } catch {
      /* fall through and refetch */
    }
  }

  try {
    const url = `${env.fxApiUrl}?base=INR&symbols=USD,GBP,AED,INR`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const rates: Record<string, number> = data?.rates ?? {};
    rates.INR = 1;
    const table: RateTable = { base: 'INR', rates, fetchedAt: Date.now() };
    await redis.set(keys.fxRates(), JSON.stringify(table), 'EX', env.fxCacheTtl);
    return table;
  } catch {
    // Conservative static fallback so display never breaks.
    return {
      base: 'INR',
      rates: { INR: 1, USD: 0.012, GBP: 0.0095, AED: 0.044 },
      fetchedAt: Date.now(),
    };
  }
}

/** Convert an INR amount (in rupees) into the target currency. */
export async function convertFromINR(amountInr: number, to: Currency): Promise<number> {
  if (to === 'INR') return amountInr;
  const table = await getRates();
  const rate = table.rates[to] ?? 1;
  return Math.round(amountInr * rate * 100) / 100;
}

const SYMBOLS: Record<Currency, string> = { INR: '₹', USD: '$', GBP: '£', AED: 'AED ' };

export function currencySymbol(c: Currency): string {
  return SYMBOLS[c] ?? '';
}
