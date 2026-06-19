/** Convert paise (integer) to a display string like "₹150" or "₹12.50". */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  const isWhole = Number.isInteger(rupees);
  return `₹${isWhole ? rupees.toString() : rupees.toFixed(2)}`;
}

/** Signed display for credit transactions: "+₹100" / "-₹50". */
export function formatSignedINR(paise: number, type: 'earned' | 'redeemed' | 'refunded'): string {
  const sign = type === 'redeemed' ? '-' : '+';
  return `${sign}${formatINR(paise)}`;
}
