// Interview scheduling for applicants (pandits and astrologers).
//
// IMPORTANT: when you have a real scheduling page, set PRANAM_BOOKING_PAGE to it
// (a Google Calendar appointment schedule like https://calendar.app.google/xxxx,
// or a Calendly link like https://calendly.com/your-team/interview). Until then
// we fall back to a Google Calendar "create event" link, which always works:
// it opens Google Calendar with a prefilled "Pranam partner interview" event the
// applicant can place on their own calendar, and our team confirms over WhatsApp.

const PRANAM_BOOKING_PAGE = ""; // e.g. "https://calendar.app.google/abcd1234"

// A working create-event link (no account setup required). Used as the default.
export function interviewEventLink(name?: string): string {
  const text = encodeURIComponent("Pranam partner interview");
  const who = name ? ` for ${name}` : "";
  const details = encodeURIComponent(
    `15 minute verification call${who}. Our team will share the meeting link over WhatsApp.`,
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
}

// The link the interview buttons open. Prefers a real scheduling page if set.
export const INTERVIEW_BOOKING_URL = PRANAM_BOOKING_PAGE || interviewEventLink();
