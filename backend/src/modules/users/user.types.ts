import { Role } from '../../utils/jwt';
import { Currency } from '../../utils/currency';

/** Full users row as stored in PostgreSQL. */
export interface UserRow {
  id: string;
  phone: string | null;
  email: string | null;
  google_id: string | null;
  name: string;
  photo_url: string | null;
  role: Role;
  referral_code: string;
  referred_by: string | null;
  gotra: string | null;
  city: string | null;
  country: string;
  currency: Currency;
  is_nri: boolean;
  credits_balance: number; // paise
  fcm_token: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressRow {
  id: string;
  user_id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface CreditTxRow {
  id: string;
  user_id: string;
  type: 'earned' | 'redeemed' | 'refunded';
  amount: number;
  source: 'referral' | 'order_refund' | 'promotion';
  reference_id: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
}
