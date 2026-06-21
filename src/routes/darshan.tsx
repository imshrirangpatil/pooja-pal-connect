import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import darshanImg from "@/assets/cat-darshan.jpg";
import { Video, Bell, Clock, MapPin, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/darshan")({
  head: () => ({
    meta: [
      { title: "Live Mandir Darshan & Live Pooja — Pranam" },
      { name: "description", content: "Watch live aarti and darshan from famous Indian temples, and join live poojas streamed straight to your phone." },
    ],
  }),
  component: DarshanPage,
});

const TEMPLES = [
  { name: "Shri Kashi Vishwanath", city: "Varanasi", time: "Mangala Aarti · 3:00 AM" },
  { name: "Shri Mahakaleshwar", city: "Ujjain", time: "Bhasma Aarti · 4:00 AM" },
  { name: "Shri Siddhivinayak", city: "Mumbai", time: "Kakad Aarti · 5:30 AM" },
  { name: "Shri Tirupati Balaji", city: "Tirumala", time: "Suprabhatam · 3:00 AM" },
  { name: "Shri Vaishno Devi", city: "Katra", time: "Aarti · 6:00 AM & 7:00 PM" },
  { name: "Shri Jagannath", city: "Puri", time: "Mangal Aarti · 5:00 AM" },
  { name: "Shri Somnath", city: "Gir Somnath", time: "Sandhya Aarti · 7:00 PM" },
  { name: "Shri Ram Mandir", city: "Ayodhya", time: "Shringaar Aarti · 6:30 AM" },
];

function DarshanPage() {
  return (
    <MobileShell>
      <TopBar title="Live Darshan & Pooja" subtitle="Aarti from temples, straight to your phone" />

      <section className="px-5 pt-4">
        <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-soft">
          <div className="relative">
            <img src={darshanImg} alt="Temple aarti" width={768} height={768} className="h-44 w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Coming soon
            </span>
          </div>
          <div className="p-4">
            <h2 className="text-base font-bold">Darshan, anywhere you are</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Tune in to live aarti from India's most sacred temples, or book a private live pooja performed in your name with sankalp and prasad delivered home.
            </p>
            <button className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              <Bell className="h-3.5 w-3.5" /> Notify me when live
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Temples on Pranam</h3>
          <span className="text-[11px] text-muted-foreground">{TEMPLES.length} live feeds</span>
        </div>
        <div className="mt-3 space-y-2">
          {TEMPLES.map((t) => (
            <article key={t.name} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Video className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {t.city}
                  <span className="opacity-50">·</span>
                  <Clock className="h-3 w-3" /> {t.time}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </article>
          ))}
        </div>
      </section>

      <section className="mx-5 mt-6 mb-6 rounded-3xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Private live pooja</p>
        <h3 className="mt-1 text-base font-bold">Sankalp in your name, streamed live</h3>
        <p className="mt-1 text-xs text-muted-foreground">A verified pandit performs the pooja with your gotra and sankalp, broadcast on a private link. Prasad delivered to your address.</p>
        <Link to="/poojas" className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
          Browse poojas <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </MobileShell>
  );
}
