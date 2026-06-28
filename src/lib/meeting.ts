// A shared video-call room for a booking, joined by both the devotee and the
// pandit. We use Jitsi Meet: a deterministic room name derived from the booking
// id means both sides open the same link and land in the same call, with no
// accounts, no backend and no scheduling. Works in the browser and the Jitsi app.
//
// To switch providers later (e.g. a WhatsApp click-to-video link or your own
// Daily/Twilio room), change only this function.
export function meetingLink(bookingId: string): string {
  return `https://meet.jit.si/Pranam-${bookingId}`;
}
