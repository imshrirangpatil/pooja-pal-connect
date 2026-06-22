import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { usePoojas } from "@/lib/poojas-source";
import { ChevronRight, Filter, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/poojas/")({
  head: () => ({
    meta: [
      { title: "All Poojas — Pranam" },
      { name: "description", content: "Browse all poojas — Ganesh, Satyanarayan, Griha Pravesh, Lakshmi and more." },
    ],
  }),
  component: PoojasList,
});

const filters = ["All", "Popular", "Festive", "Home", "Business", "Wellness"];

function PoojasList() {
  const { poojas, loading } = usePoojas();
  return (
    <MobileShell>
      <TopBar
        title="All Poojas"
        subtitle={`${poojas.length} rituals available`}
        right={
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-soft transition active:scale-95">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </button>
        }
      />

      <div className="px-5 pt-4 pb-8">
        {/* Filters */}
        <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((t, i) => (
            <button
              key={t}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide transition active:scale-95 ${
                i === 0
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
          {loading && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-3xl bg-muted" />
              ))}
            </>
          )}
          {poojas.map((p) => (
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
