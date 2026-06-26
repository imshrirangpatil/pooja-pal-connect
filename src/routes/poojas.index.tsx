import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { usePoojas } from "@/lib/poojas-source";
import type { Pooja } from "@/lib/data";
import { ChevronRight, Clock, Sparkles, Search } from "lucide-react";

export const Route = createFileRoute("/poojas/")({
  head: () => ({
    meta: [
      { title: "All Poojas - Pranam" },
      { name: "description", content: "Browse all poojas - Ganesh, Satyanarayan, Griha Pravesh, Lakshmi and more." },
    ],
  }),
  component: PoojasList,
});

const FILTERS = ["All", "Popular", "Festive", "Home", "Business", "Wellness"] as const;
type FilterKey = (typeof FILTERS)[number];

// Poojas have no explicit category column, so themes are derived from the name,
// tagline (the pooja type) and season. A pooja can match more than one theme.
function matchesTheme(p: Pooja, theme: FilterKey): boolean {
  if (theme === "All") return true;
  if (theme === "Popular") return !!p.popular;
  const hay = `${p.name} ${p.tagline ?? ""} ${p.season ?? ""}`.toLowerCase();
  switch (theme) {
    case "Festive":
      return (
        !!p.season ||
        /festival|diwali|holi|navratri|navaratri|chaturthi|janmashtami|raksha|dussehra|sankranti|teej|ekadashi|purnima|amavasya|akshaya|nag panchami|guru purnima|ram navami/.test(hay)
      );
    case "Home":
      return /griha|vastu|vaastu|new beginning|naamkaran|namkaran|annaprashan|mundan|housewarming|upanayan|pravesh/.test(hay);
    case "Business":
      return /vyapar|vyaapar|udyog|business|ayudha|lakshmi|laxmi|kuber|wealth|prosperity|aarambh|shop|office/.test(hay);
    case "Wellness":
      return /navagraha|navgrah|dosh|nivaran|mahamrityunjaya|mrityunjaya|shanti|chakra|healing|ayush|rog|graha|shani|rahu|ketu|mangal|kaal sarp|pitru|tarpan|rudra|abhishek|health/.test(hay);
    default:
      return true;
  }
}

function PoojasList() {
  const { poojas, loading } = usePoojas();
  const [active, setActive] = useState<FilterKey>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return poojas.filter((p) => {
      if (!matchesTheme(p, active)) return false;
      if (!q) return true;
      return `${p.name} ${p.tagline ?? ""} ${p.season ?? ""}`.toLowerCase().includes(q);
    });
  }, [poojas, active, query]);

  return (
    <MobileShell>
      <TopBar title="All Poojas" subtitle={`${filtered.length} of ${poojas.length} rituals`} />

      <div className="px-5 pt-4 pb-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search poojas, e.g. Ganesh, Navagraha, Griha Pravesh"
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="-mx-5 mt-3 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide transition active:scale-95 ${
                active === t
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="mt-4 flex flex-col gap-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-muted" />
            ))}

          {!loading && filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No poojas match{query ? ` "${query}"` : ""}. Try another search or filter.
            </div>
          )}

          {filtered.map((p) => (
            <Link
              key={p.slug}
              to="/poojas/$slug"
              params={{ slug: p.slug }}
              className="group block overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <article>
                <div className="relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    width={600}
                    height={350}
                    loading="lazy"
                    className="h-36 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

                  {p.season && (
                    <span className="absolute left-3.5 top-3.5 flex items-center gap-1 rounded-full bg-background/95 px-3 py-1.5 text-[11px] font-semibold text-accent backdrop-blur shadow-soft">
                      <Sparkles className="h-3 w-3" />
                      {p.season}
                    </span>
                  )}
                  {p.samagriIncluded && (
                    <span className="absolute right-3.5 top-3.5 rounded-full bg-maroon px-3 py-1.5 text-[11px] font-semibold text-cream shadow-soft">
                      Samagri incl.
                    </span>
                  )}
                </div>

                <div className="p-3.5 pt-4">
                  <h3 className="text-base font-bold leading-tight tracking-tight text-foreground font-display">{p.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{p.tagline}</p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {p.duration && (
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                        <Clock className="h-3 w-3" />
                        {p.duration}
                      </span>
                    )}
                    {p.includes && p.includes.length > 0 && (
                      <span className="rounded-full bg-secondary px-2 py-0.5">
                        {p.includes.length} items
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Starts at</p>
                      <p className="mt-0.5 text-xl font-extrabold text-accent font-display">
                        ₹{p.priceFrom.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-warm px-4 py-2 text-sm font-semibold text-cream shadow-soft transition group-hover:shadow-glow">
                      Book
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
