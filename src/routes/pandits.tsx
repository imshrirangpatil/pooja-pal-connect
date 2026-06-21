import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { pandits, poojas } from "@/lib/data";
import { ShieldCheck, Star, MapPin, Languages, SlidersHorizontal, X } from "lucide-react";

export const Route = createFileRoute("/pandits")({
  head: () => ({
    meta: [
      { title: "Verified Pandits — Pranam" },
      { name: "description", content: "Hand-vetted pandits across India, with shastra knowledge and lineage verified." },
    ],
  }),
  component: Pandits,
});

const ALL_LANGS = Array.from(new Set(pandits.flatMap((p) => p.languages))).sort();
const EXP_OPTIONS = [
  { label: "Any", min: 0 },
  { label: "5+ yrs", min: 5 },
  { label: "10+ yrs", min: 10 },
  { label: "15+ yrs", min: 15 },
  { label: "20+ yrs", min: 20 },
];
const RATING_OPTIONS = [
  { label: "Any", min: 0 },
  { label: "4.5★+", min: 4.5 },
  { label: "4.7★+", min: 4.7 },
  { label: "4.9★+", min: 4.9 },
];

function Pandits() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<string | null>(null);
  const [expMin, setExpMin] = useState(0);
  const [ratingMin, setRatingMin] = useState(0);
  const [pooja, setPooja] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      pandits.filter(
        (p) =>
          (!language || p.languages.includes(language)) &&
          p.experience >= expMin &&
          p.rating >= ratingMin &&
          (!pooja || p.poojaSlugs.includes(pooja)),
      ),
    [language, expMin, ratingMin, pooja],
  );

  const activeCount = (language ? 1 : 0) + (expMin ? 1 : 0) + (ratingMin ? 1 : 0) + (pooja ? 1 : 0);

  const reset = () => {
    setLanguage(null);
    setExpMin(0);
    setRatingMin(0);
    setPooja(null);
  };

  return (
    <MobileShell>
      <TopBar title="Our Pandits" subtitle={`${filtered.length} of ${pandits.length} verified acharyas`} />

      {/* Filters bar */}
      <div className="sticky top-0 z-20 -mx-0 border-b border-border/60 bg-background/95 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
          </button>
          {language && <Chip label={language} onClear={() => setLanguage(null)} />}
          {expMin > 0 && <Chip label={`${expMin}+ yrs`} onClear={() => setExpMin(0)} />}
          {ratingMin > 0 && <Chip label={`${ratingMin}★+`} onClear={() => setRatingMin(0)} />}
          {pooja && <Chip label={poojas.find((p) => p.slug === pooja)?.name ?? pooja} onClear={() => setPooja(null)} />}
        </div>
      </div>

      <section className="mx-5 mt-4 rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <ShieldCheck className="h-6 w-6 text-accent" />
        <h2 className="mt-2 text-base font-bold">4-step verification</h2>
        <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
          {["Aadhaar & ID verification", "Lineage & gurukul certification", "Shastra knowledge interview", "On-ground review by senior acharyas"].map((s, i) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <div className="space-y-3 px-5 pb-6 pt-5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center">
            <p className="text-sm font-semibold">No pandits match these filters</p>
            <button onClick={reset} className="mt-2 text-xs font-semibold text-primary">Reset filters</button>
          </div>
        ) : (
          filtered.map((p) => (
            <Link key={p.id} to="/pandits/$id" params={{ id: p.id }} className="block">
              <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
                    {p.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                      <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.city}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-0.5 font-semibold">
                        <Star className="h-3 w-3 fill-primary text-primary" /> {p.rating}
                      </span>
                      <span className="text-muted-foreground">({p.reviews}) · {p.experience} yrs</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
                  <p className="flex items-start gap-1.5"><Languages className="mt-0.5 h-3 w-3" /> {p.languages.join(", ")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.specialties.map((s) => (
                      <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 w-full rounded-full bg-foreground py-2.5 text-center text-xs font-semibold text-background">View Profile</div>
              </article>
            </Link>
          ))
        )}
      </div>

      {/* Filter sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto w-full max-w-md rounded-t-3xl bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold">Filter pandits</h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <FilterGroup label="Language">
              <div className="flex flex-wrap gap-1.5">
                <Pill active={!language} onClick={() => setLanguage(null)}>Any</Pill>
                {ALL_LANGS.map((l) => (
                  <Pill key={l} active={language === l} onClick={() => setLanguage(l)}>{l}</Pill>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Experience">
              <div className="flex flex-wrap gap-1.5">
                {EXP_OPTIONS.map((o) => (
                  <Pill key={o.label} active={expMin === o.min} onClick={() => setExpMin(o.min)}>{o.label}</Pill>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Rating">
              <div className="flex flex-wrap gap-1.5">
                {RATING_OPTIONS.map((o) => (
                  <Pill key={o.label} active={ratingMin === o.min} onClick={() => setRatingMin(o.min)}>{o.label}</Pill>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Pooja they perform">
              <div className="flex flex-wrap gap-1.5">
                <Pill active={!pooja} onClick={() => setPooja(null)}>Any</Pill>
                {poojas.map((p) => (
                  <Pill key={p.slug} active={pooja === p.slug} onClick={() => setPooja(p.slug)}>{p.name}</Pill>
                ))}
              </div>
            </FilterGroup>

            <div className="mt-5 flex gap-2">
              <button onClick={reset} className="flex-1 rounded-full border border-border bg-card py-3 text-xs font-semibold">Reset</button>
              <button onClick={() => setOpen(false)} className="flex-1 rounded-full bg-primary py-3 text-xs font-semibold text-primary-foreground">Show {filtered.length}</button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button onClick={onClear} className="flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
      {label} <X className="h-3 w-3" />
    </button>
  );
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"}`}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
