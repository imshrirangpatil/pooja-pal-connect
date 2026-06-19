import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { usePoojas } from "@/lib/poojas-source";
import { ChevronRight, Filter } from "lucide-react";

export const Route = createFileRoute("/poojas/")({
  head: () => ({
    meta: [
      { title: "All Poojas — Pranam" },
      { name: "description", content: "Browse all poojas — Ganesh, Satyanarayan, Griha Pravesh, Lakshmi and more." },
    ],
  }),
  component: PoojasList,
});

function PoojasList() {
  const { poojas } = usePoojas();
  return (
    <MobileShell>
      <TopBar
        title="All Poojas"
        subtitle={`${poojas.length} rituals available`}
        right={
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
            <Filter className="h-4 w-4" />
          </button>
        }
      />

      <div className="px-5 pt-4">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["All", "Popular", "Festive", "Home", "Business", "Wellness"].map((t, i) => (
            <button
              key={t}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${
                i === 0 ? "bg-gradient-warm text-primary-foreground shadow-glow" : "border border-border bg-card text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {poojas.map((p) => (
            <Link key={p.slug} to="/poojas/$slug" params={{ slug: p.slug }}>
              <article className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
                <div className="relative">
                  <img src={p.image} alt={p.name} width={800} height={500} loading="lazy" className="h-44 w-full object-cover" />
                  {p.season && (
                    <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold text-accent backdrop-blur">
                      ⭐ {p.season}
                    </span>
                  )}
                  {p.samagriIncluded && (
                    <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground">
                      Samagri incl.
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.tagline}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Starts at</p>
                      <p className="text-xl font-bold text-accent">₹{p.priceFrom.toLocaleString("en-IN")}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-warm px-4 py-2 text-xs font-semibold text-primary-foreground">
                      Book <ChevronRight className="h-3.5 w-3.5" />
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
