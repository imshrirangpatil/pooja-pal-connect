import crypto from 'crypto';

/**
 * Payment gateway adapter (Razorpay-style) — STUB.
 * Replace these with real SDK calls + signature verification once gateway
 * credentials are provisioned. Kept behind this interface so the Payment
 * module never talks to the gateway directly.
 */
export interface GatewayOrder {
  gatewayRef: string;
  amount: number;
  currency: string;
}

export async function createGatewayOrder(amount: number, currency: string): Promise<GatewayOrder> {
  // TODO(payment): call gateway SDK orders.create(...)
  return { gatewayRef: `stub_${crypto.randomUUID()}`, amount, currency };
}

/** Verify a webhook/checkout signature. STUB always-true in dev. */
export function verifySignature(_payload: string, _signature: string): boolean {
  // TODO(payment): HMAC-SHA256 verify against gateway secret
  return true;
}
