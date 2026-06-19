import axios from 'axios';
import { env } from '../config/env';

/**
 * Send an OTP SMS via MSG91. In dev (SMS_DRY_RUN=true) we log instead of sending,
 * so the flow is testable without a live MSG91 account.
 */
export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  if (env.smsDryRun) {
    console.log(`[sms:dry-run] OTP for ${phone} = ${otp}`);
    return;
  }

  // MSG91 OTP/flow endpoint. Strip the leading "+" — MSG91 wants country code + number.
  const mobile = phone.replace(/^\+/, '');
  try {
    await axios.post(
      'https://control.msg91.com/api/v5/otp',
      {
        template_id: env.msg91TemplateId,
        mobile,
        otp,
        sender: env.msg91SenderId,
      },
      {
        headers: { authkey: env.msg91AuthKey, 'Content-Type': 'application/json' },
        timeout: 8000,
      },
    );
  } catch (err: any) {
    console.error('[sms] MSG91 send failed', err?.response?.data ?? err?.message);
    throw new Error('Failed to send OTP SMS');
  }
}
