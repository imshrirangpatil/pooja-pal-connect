/**
 * Delivery adapters for notifications — STUBS.
 * Wire FCM / email provider here. They are no-ops in dev so the in-app
 * notification record is still created and returned.
 */
export async function sendPush(fcmToken: string | null, title: string, body: string): Promise<void> {
  if (!fcmToken) return;
  // TODO(notification): call Firebase Admin messaging().send(...)
  console.log(`[push:stub] -> ${fcmToken.slice(0, 8)}… "${title}"`);
}

export async function sendEmail(to: string | null, subject: string, _body: string): Promise<void> {
  if (!to) return;
  // TODO(notification): integrate transactional email provider
  console.log(`[email:stub] -> ${to} "${subject}"`);
}
