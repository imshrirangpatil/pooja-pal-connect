import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { usePoojas } from "@/lib/poojas-source";
import type { Pooja } from "@/lib/data";
import { Search } from "lucide-react";

export const Route = createFileRoute("/poojas/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
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
  const { q } = Route.useSearch();
  const [active, setActive] = useState<FilterKey>("All");
  const [query, setQuery] = useState(q ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return poojas.filter((p) => {
      if (!matchesTheme(p, active)) return false;
      if (!q) return true;
      return `${p.name} ${p.tagline ?? ""} ${p.season ?? ""}`.toLowerCase().includes(q);
    });
  }, [poojas, active, query]);

  const popular = useMemo(() => poojas.filter((p) => p.popular).slice(0, 10), [poojas]);

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
            aria-label="Search poojas"
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

        {/* Best Sellers */}
        {active === "All" && !query.trim() && popular.length > 0 && (
          <section className="mt-4">
            <h2 className="text-sm font-bold">Best Sellers</h2>
            <div className="-mx-5 mt-2 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {popular.map((p) => (
                <Link
                  key={p.slug}
                  to="/poojas/$slug"
                  params={{ slug: p.slug }}
                  className="min-w-[150px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft"
                >
                  <img src={p.image} alt={p.name} loading="lazy" className="h-24 w-full object-cover" />
                  <div className="p-2.5">
                    <p className="line-clamp-1 text-xs font-bold">{p.name}</p>
                    <p className="mt-0.5 text-sm font-bold text-accent">₹{p.priceFrom.toLocaleString("en-IN")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
            ))}

          {!loading && filtered.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No poojas match{query ? ` "${query}"` : ""}. Try another search or filter.
            </div>
          )}

          {filtered.map((p) => (
            <Link
              key={p.slug}
              to="/poojas/$slug"
              params={{ slug: p.slug }}
              className="group block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="relative aspect-[4/3]">
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                {p.popular ? (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">Best Seller</span>
                ) : p.season ? (
                  <span className="absolute left-2 top-2 rounded-full bg-background/95 px-2 py-0.5 text-[9px] font-semibold text-accent shadow-soft">{p.season}</span>
                ) : null}
              </div>
              <div className="p-2.5">
                <h3 className="line-clamp-1 text-sm font-bold leading-tight">{p.name}</h3>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{p.tagline}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-sm font-bold text-accent">₹{p.priceFrom.toLocaleString("en-IN")}</p>
                  {p.duration && <span className="text-[10px] text-muted-foreground">{p.duration}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
