import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { poojas } from "@/lib/data";
import { usePandits } from "@/lib/pandits-source";
import { usePanditRatings } from "@/lib/ratings";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, Star, MapPin, Languages, SlidersHorizontal, X, Search } from "lucide-react";

export const Route = createFileRoute("/pandits/")({
  head: () => ({
    meta: [
      { title: "Verified Pandits - Pranam" },
      { name: "description", content: "Hand-vetted pandits across India, with shastra knowledge and lineage verified." },
    ],
  }),
  component: Pandits,
});

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
  const { pandits } = usePandits();
  const ratings = usePanditRatings();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string | null>(null);
  const [expMin, setExpMin] = useState(0);
  const [ratingMin, setRatingMin] = useState(0);
  const [pooja, setPooja] = useState<string | null>(null);

  const ALL_LANGS = useMemo(() => Array.from(new Set(pandits.flatMap((p) => p.languages))).sort(), [pandits]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pandits.filter((p) => {
      if (!(!language || p.languages.includes(language))) return false;
      if (p.experience < expMin) return false;
      if (p.rating < ratingMin) return false;
      if (pooja && !p.poojaSlugs.includes(pooja)) return false;
      if (q) {
        const hay = `${p.name} ${p.city} ${p.specialties.join(" ")} ${p.languages.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pandits, query, language, expMin, ratingMin, pooja]);

  const activeCount = (language ? 1 : 0) + (expMin ? 1 : 0) + (ratingMin ? 1 : 0) + (pooja ? 1 : 0);

  const reset = () => {
    setQuery("");
    setLanguage(null);
    setExpMin(0);
    setRatingMin(0);
    setPooja(null);
  };

  return (
    <MobileShell>
      <TopBar title={t("pandits.title")} subtitle={`${filtered.length} / ${pandits.length} ${t("pandits.subtitle")}`} />

      {/* Filters bar */}
      <div className="sticky top-0 z-20 -mx-0 space-y-3 border-b border-border/60 bg-background/95 px-5 py-3 backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pandits.searchPlaceholder")}
            aria-label={t("common.search")}
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t("pandits.filters")}{activeCount > 0 ? ` · ${activeCount}` : ""}
          </button>
          {language && <Chip label={language} onClear={() => setLanguage(null)} />}
          {expMin > 0 && <Chip label={`${expMin}+ yrs`} onClear={() => setExpMin(0)} />}
          {ratingMin > 0 && <Chip label={`${ratingMin}★+`} onClear={() => setRatingMin(0)} />}
          {pooja && <Chip label={poojas.find((p) => p.slug === pooja)?.name ?? pooja} onClear={() => setPooja(null)} />}
        </div>
      </div>

      <section className="mx-5 mt-4 rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <ShieldCheck className="h-6 w-6 text-accent" />
        <h2 className="mt-2 text-base font-bold">{t("pandits.verification")}</h2>
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
            <p className="text-sm font-semibold">{t("pandits.noMatch")}</p>
            <button onClick={reset} className="mt-2 text-xs font-semibold text-primary">{t("pandits.resetFilters")}</button>
          </div>
        ) : (
          filtered.map((p) => (
            <Link key={p.id} to="/pandits/$id" params={{ id: p.id }} className="block">
              <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} className="h-16 w-16 shrink-0 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
                      {p.initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                      <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.city}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      {ratings[p.id]?.count ? (
                        <>
                          <span className="inline-flex items-center gap-0.5 font-semibold">
                            <Star className="h-3 w-3 fill-primary text-primary" /> {ratings[p.id].avg.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">({ratings[p.id].count}) · {p.experience} yrs</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">New · {p.experience} yrs experience</span>
                      )}
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
                <div className="mt-3 w-full rounded-full bg-foreground py-2.5 text-center text-xs font-semibold text-background">{t("pandits.viewProfile")}</div>
              </article>
            </Link>
          ))
        )}
      </div>

      {/* Filter sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card shadow-soft">
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <h3 className="text-base font-bold">Filter pandits</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-5">
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
            </div>

            <div className="flex gap-2 border-t border-border/60 bg-card px-5 py-4">
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
