import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { astrologers } from "@/lib/data";
import { Phone, MessageCircle, Star, Sparkles } from "lucide-react";

export const Route = createFileRoute("/astrology")({
  head: () => ({
    meta: [
      { title: "Astrology consult — Divya" },
      { name: "description", content: "Talk to verified Vedic astrologers, tarot readers and numerologists, live." },
    ],
  }),
  component: Astrology,
});

function Astrology() {
  return (
    <MobileShell>
      <TopBar title="Astrology" subtitle="Chat or call live experts" />

      <section className="mx-5 mt-4 rounded-3xl bg-gradient-warm p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
          <Sparkles className="h-3.5 w-3.5" /> Free first consult
        </div>
        <h2 className="mt-2 text-xl font-bold leading-tight">Your free 5-min reading awaits</h2>
        <p className="mt-1 text-sm text-primary-foreground/90">Share your details to get matched with the right astrologer.</p>
        <button className="mt-4 rounded-full bg-background/95 px-4 py-2 text-xs font-semibold text-accent">Get free reading</button>
      </section>

      <section className="px-5 pt-6">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["All", "Vedic", "Tarot", "Vastu", "Numerology", "Palmistry"].map((t, i) => (
            <button key={t} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${i === 0 ? "bg-foreground text-background" : "border border-border bg-card"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {astrologers.map((a) => (
            <article key={a.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-warm text-base font-bold text-primary-foreground">
                    {a.initials}
                  </div>
                  {a.online && <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-green-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{a.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{a.expertise}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-primary text-primary" /> {a.rating}
                    </span>
                    <span>{a.experience} yr exp</span>
                    <span>{a.languages.join(", ")}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-accent">₹{a.pricePerMin}</p>
                  <p className="text-[10px] text-muted-foreground">/min</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {a.online ? (
                  <Link
                    to="/astrology/chat/$id"
                    params={{ id: a.id }}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-xs font-semibold text-secondary-foreground"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </Link>
                ) : (
                  <button disabled className="flex items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-xs font-semibold text-secondary-foreground opacity-50">
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </button>
                )}
                <button disabled={!a.online} className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-warm py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                  <Phone className="h-3.5 w-3.5" /> Call
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
