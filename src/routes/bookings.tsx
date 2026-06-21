import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { CalendarCheck, Clock, ChevronRight, Star, X, MapPin, Phone, CreditCard, Calendar } from "lucide-react";
import { ReviewModule } from "@/components/ReviewModule";
import { pandits } from "@/lib/data";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — Pranam" },
      { name: "description", content: "Track upcoming poojas and past bookings." },
    ],
  }),
  component: Bookings,
});

type Booking = {
  id: string; pooja: string; panditId: string; pandit: string; date: string;
  status: "Completed" | "Cancelled"; amount: number; address: string; phone: string;
  payment: string; bookedOn: string;
};

const initialBookings: Booking[] = [
  { id: "b1", pooja: "Lakshmi Pooja", panditId: "p2", pandit: "Pandit Suresh Joshi", date: "Sat, 1 Nov · 6:30 PM", status: "Completed", amount: 1799, address: "204, Sunflower Apartments, Andheri West, Mumbai", phone: "+91 98765 43210", payment: "UPI — Paid", bookedOn: "21 Oct 2025" },
  { id: "b2", pooja: "Satyanarayan Katha", panditId: "p3", pandit: "Acharya Venkat Iyer", date: "Sun, 16 Nov · 10:00 AM", status: "Cancelled", amount: 2199, address: "12, Gokuldham Society, Goregaon East, Mumbai", phone: "+91 87654 32109", payment: "Refunded to Wallet", bookedOn: "18 Oct 2025" },
  { id: "b3", pooja: "Ganesh Pooja", panditId: "p2", pandit: "Pandit Suresh Joshi", date: "Mon, 8 Sep · 9:00 AM", status: "Completed", amount: 1499, address: "55, Krishna Niwas, Borivali, Mumbai", phone: "+91 76543 21098", payment: "Wallet — Paid", bookedOn: "1 Sep 2025" },
];

export function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [tab, setTab] = useState<"Completed" | "Cancelled">("Completed");
  const [rating, setRating] = useState<{ panditId: string; bookingId: string } | null>(null);
  const [details, setDetails] = useState<Booking | null>(null);

  const list = bookings.filter((b) => b.status === tab);

  const cancelBooking = (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Cancelled", payment: "Refunded to Wallet" } : b)));
    setDetails(null);
    setTab("Cancelled");
  };

  return (
    <MobileShell>
      <TopBar title="My Bookings" subtitle="Upcoming & past poojas" />

      <div className="px-5 pt-4">
        <div className="flex gap-2 rounded-full border border-border bg-card p-1">
          {(["Completed", "Cancelled"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-xs font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-5 space-y-3">
            {list.map((b) => (
              <article key={b.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${b.status === "Completed" ? "bg-green-100 text-green-700" : "bg-secondary text-accent"}`}>
                    {b.status}
                  </span>
                  <span className="text-sm font-bold text-accent">₹{b.amount.toLocaleString("en-IN")}</span>
                </div>
                <h3 className="mt-2 text-base font-bold">{b.pooja}</h3>
                <Link to="/pandits/$id" params={{ id: b.panditId }} className="text-xs text-primary underline-offset-2 hover:underline">
                  with {b.pandit}
                </Link>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-foreground/80">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {b.date}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setDetails(b)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-full bg-secondary py-2 text-xs font-semibold text-secondary-foreground"
                  >
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  {b.status === "Completed" && (
                    <button
                      onClick={() => setRating({ panditId: b.panditId, bookingId: b.id })}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground"
                    >
                      <Star className="h-3.5 w-3.5" /> Rate Pandit
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {rating && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setRating(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card shadow-soft">
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
              <div>
                <p className="text-base font-bold">Rate {pandits.find((p) => p.id === rating.panditId)?.name ?? "your pandit"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Help others find the right acharya.</p>
              </div>
              <button onClick={() => setRating(null)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <ReviewModule
                targetKind="pandit"
                targetId={rating.panditId}
                source="booking"
                referenceId={rating.bookingId}
                compact
                onSubmitted={() => setTimeout(() => setRating(null), 600)}
              />
            </div>
          </div>
        </div>
      )}

      {details && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setDetails(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card shadow-soft">
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
              <div>
                <p className="text-base font-bold">Booking Details</p>
                <p className="mt-0.5 text-xs text-muted-foreground">ID: {details.id}</p>
              </div>
              <button onClick={() => setDetails(null)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <div className="mt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${details.status === "Completed" ? "bg-green-100 text-green-700" : "bg-secondary text-accent"}`}>
                    {details.status}
                  </span>
                  <span className="text-sm font-bold text-accent">₹{details.amount.toLocaleString("en-IN")}</span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Pooja</p>
                  <p className="mt-0.5 text-sm font-semibold">{details.pooja}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Pandit</p>
                  <Link to="/pandits/$id" params={{ id: details.panditId }} className="mt-0.5 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline">
                    {details.pandit}
                  </Link>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-sm font-medium">{details.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{details.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium">{details.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="text-sm font-medium">{details.payment}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-[11px] text-muted-foreground">Booked on {details.bookedOn}</p>
                </div>

                {details.status !== "Cancelled" && (
                  <button
                    onClick={() => cancelBooking(details.id)}
                    className="w-full rounded-full border border-destructive/30 bg-destructive/10 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/15"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <CalendarCheck className="h-8 w-8 text-accent" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No bookings yet</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">Your upcoming poojas will appear here once you book.</p>
      <Link to="/poojas" className="mt-4 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow">
        Browse Poojas
      </Link>
    </div>
  );
}
