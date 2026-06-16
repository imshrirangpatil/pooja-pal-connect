import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { CalendarCheck, Clock, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — Pranam" },
      { name: "description", content: "Track upcoming poojas and past bookings." },
    ],
  }),
  component: Bookings,
});

const mock = [
  { id: "b1", pooja: "Lakshmi Pooja", pandit: "Pandit Suresh Joshi", date: "Sat, 1 Nov · 6:30 PM", status: "Confirmed", amount: 1799 },
  { id: "b2", pooja: "Satyanarayan Katha", pandit: "Acharya Venkat Iyer", date: "Sun, 16 Nov · 10:00 AM", status: "Pending", amount: 2199 },
];

export function Bookings() {
  return (
    <MobileShell>
      <TopBar title="My Bookings" subtitle="Upcoming & past poojas" />

      <div className="px-5 pt-4">
        <div className="flex gap-2 rounded-full border border-border bg-card p-1">
          {["Upcoming", "Completed", "Cancelled"].map((t, i) => (
            <button key={t} className={`flex-1 rounded-full py-2 text-xs font-semibold ${i === 0 ? "bg-gradient-warm text-primary-foreground" : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {mock.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-5 space-y-3">
            {mock.map((b) => (
              <article key={b.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${b.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-secondary text-accent"}`}>
                    {b.status}
                  </span>
                  <span className="text-sm font-bold text-accent">₹{b.amount.toLocaleString("en-IN")}</span>
                </div>
                <h3 className="mt-2 text-base font-bold">{b.pooja}</h3>
                <p className="text-xs text-muted-foreground">with {b.pandit}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-foreground/80">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {b.date}
                </div>
                <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-full bg-secondary py-2 text-xs font-semibold text-secondary-foreground">
                  View details <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
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
      <Link to="/poojas" className="mt-4 rounded-full bg-gradient-warm px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow">
        Browse Poojas
      </Link>
    </div>
  );
}
