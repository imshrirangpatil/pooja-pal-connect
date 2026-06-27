// Where applicants (pandits and astrologers) book their verification interview slot.
// Replace this with your real Google Calendar appointment page or Calendly link.
// A Google Calendar "appointment schedule" link looks like:
//   https://calendar.app.google/your-booking-code
export const INTERVIEW_BOOKING_URL =
  "https://calendar.google.com/calendar/u/0/appointments/schedules/pranam-partner-interview";

// Builds a prefilled "create event" link as a fallback when no scheduling page is set,
// so an applicant can still drop a placeholder interview onto their own calendar.
export function interviewEventLink(name: string): string {
  const text = encodeURIComponent("Pranam partner interview");
  const details = encodeURIComponent(
    `15 minute verification call for ${name}. Our team will share the meeting link over WhatsApp.`,
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
}
