import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { pandits } from "@/lib/data";
import { ShieldCheck, Star, MapPin, Languages } from "lucide-react";

export const Route = createFileRoute("/pandits")({
  head: () => ({
    meta: [
      { title: "Verified Pandits — Pranam" },
      { name: "description", content: "Hand-vetted pandits across India, with shastra knowledge and lineage verified." },
    ],
  }),
  component: Pandits,
});

function Pandits() {
  return (
    <MobileShell>
      <TopBar title="Our Pandits" subtitle={`${pandits.length} verified acharyas`} />

      <section className="mx-5 mt-4 rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <ShieldCheck className="h-6 w-6 text-accent" />
        <h2 className="mt-2 text-base font-bold">4-step verification</h2>
        <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
          {["Aadhaar & ID verification", "Lineage & gurukul certification", "Shastra knowledge interview", "On-ground review by senior acharyas"].map((s, i) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-warm text-[9px] font-bold text-primary-foreground">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <div className="space-y-3 px-5 pt-5">
        {pandits.map((p) => (
          <article key={p.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-warm text-lg font-bold text-primary-foreground">
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
            <button className="mt-3 w-full rounded-full bg-foreground py-2.5 text-xs font-semibold text-background">View Profile</button>
          </article>
        ))}
      </div>
    </MobileShell>
  );
}
