import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { useSavedPandits } from "@/lib/saved-pandits";
import { pandits } from "@/lib/data";
import { Heart, ShieldCheck, Star, MapPin, ChevronRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/saved-pandits")({
  head: () => ({
    meta: [
      { title: "Saved Pandits — Pranam" },
      { name: "description", content: "Your saved pandits, ready to book." },
    ],
  }),
  component: SavedPandits,
});

function SavedPandits() {
  const { ids, remove } = useSavedPandits();
  const { t } = useI18n();
  const list = pandits.filter((p) => ids.includes(p.id));

  return (
    <MobileShell>
      <TopBar
        title={t("saved.title")}
        subtitle={list.length ? `${list.length} saved` : t("saved.empty")}
        right={
          <Link
            to="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <div className="px-5 pt-4 pb-10">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-soft">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Heart className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold">{t("saved.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("saved.emptySub")}</p>
            <Link
              to="/pandits"
              className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
            >
              {t("saved.browse")}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((p) => (
              <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
                <Link to="/pandits/$id" params={{ id: p.id }} className="flex flex-1 items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-base font-bold text-secondary-foreground">
                    {p.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold">{p.name}</span>
                      {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-accent" />}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.city} · {p.experience} yrs
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold">
                      <Star className="h-3 w-3 fill-primary text-primary" /> {p.rating}
                      <span className="ml-1 font-normal text-muted-foreground">({p.reviews})</span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary"
                  aria-label="Unsave"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
