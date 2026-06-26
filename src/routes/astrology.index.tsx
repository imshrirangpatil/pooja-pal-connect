import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { astrologers, type AstroCategory } from "@/lib/data";
import { Phone, MessageCircle, Star, Sparkles, Video } from "lucide-react";

export const Route = createFileRoute("/astrology/")({
  head: () => ({
    meta: [
      { title: "Astrology consult - Pranam" },
      { name: "description", content: "Talk to verified Vedic astrologers, tarot readers and numerologists, live." },
    ],
  }),
  component: Astrology,
});

const TYPES: ("All" | AstroCategory)[] = ["All", "Vedic", "Tarot", "Vastu", "Numerology", "Palmistry", "Nadi"];

function Astrology() {
  const [filter, setFilter] = useState<"All" | AstroCategory>("All");
  const list = useMemo(
    () => (filter === "All" ? astrologers : astrologers.filter((a) => a.category === filter)),
    [filter],
  );
  const firstOnline = useMemo(() => astrologers.find((a) => a.online), []);

  return (
    <MobileShell>
      <TopBar title="Astrology" subtitle="Chat or call live experts" />

      <section className="mx-5 mt-4 rounded-3xl bg-secondary p-5 text-secondary-foreground shadow-glow">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
          <Sparkles className="h-3.5 w-3.5" /> Free first consult
        </div>
        <h2 className="mt-2 text-xl font-bold leading-tight">Your free 5-min reading awaits</h2>
        <p className="mt-1 text-sm text-secondary-foreground/90">Your first five minutes are on us. Pick up where it feels right.</p>
        {firstOnline ? (
          <Link
            to="/astrology/chat/$id"
            params={{ id: firstOnline.id }}
            className="mt-4 inline-block rounded-full bg-background/95 px-5 py-2.5 text-xs font-semibold text-accent"
          >
            Start free reading
          </Link>
        ) : (
          <button disabled className="mt-4 rounded-full bg-background/95 px-5 py-2.5 text-xs font-semibold text-accent opacity-60">
            Astrologers are offline right now
          </button>
        )}
      </section>

      <section className="px-5 pt-6">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${filter === t ? "bg-foreground text-background" : "border border-border bg-card"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-xs text-muted-foreground">No {filter} astrologers right now.</p>
          ) : list.map((a) => (
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

              <div className="mt-3 grid grid-cols-3 gap-2">
                {a.online ? (
                  <Link
                    to="/astrology/chat/$id"
                    params={{ id: a.id }}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-secondary py-3 text-xs font-semibold text-secondary-foreground"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </Link>
                ) : (
                  <button disabled className="flex items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-xs font-semibold text-secondary-foreground opacity-50">
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </button>
                )}
                {a.online ? (
                  <Link
                    to="/astrology/call/$id"
                    params={{ id: a.id }}
                    search={{ mode: "audio" }}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-primary py-3 text-xs font-semibold text-primary-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call
                  </Link>
                ) : (
                  <button disabled className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground opacity-50">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </button>
                )}
                {a.online ? (
                  <Link
                    to="/astrology/call/$id"
                    params={{ id: a.id }}
                    search={{ mode: "video" }}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-card py-3 text-xs font-semibold text-foreground"
                  >
                    <Video className="h-3.5 w-3.5" /> Video
                  </Link>
                ) : (
                  <button disabled className="flex items-center justify-center gap-1.5 rounded-full border border-border bg-card py-2.5 text-xs font-semibold text-foreground opacity-50">
                    <Video className="h-3.5 w-3.5" /> Video
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
