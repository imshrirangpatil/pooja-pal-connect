import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { pandits, poojas } from "@/lib/data";
import { ShieldCheck, Star, MapPin, Languages, Award, Calendar, ChevronRight, Heart } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ReviewModule } from "@/components/ReviewModule";
import { useSavedPandits } from "@/lib/saved-pandits";
import { usePandits } from "@/lib/pandits-source";
import { usePanditRatings } from "@/lib/ratings";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/pandits/$id")({
  head: ({ params }) => {
    const p = pandits.find((x) => x.id === params.id);
    return {
      meta: [
        { title: p ? `${p.name} - Verified Pandit on Pranam` : "Pandit profile - Pranam" },
        { name: "description", content: p ? `Book ${p.name}, ${p.experience}+ years experience, ${p.rating}★ across ${p.reviews} reviews.` : "Pandit profile" },
      ],
    };
  },
  component: PanditProfile,
  notFoundComponent: () => (
    <div className="p-6 text-center text-sm text-muted-foreground">Pandit not found.</div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-6 text-center text-sm text-muted-foreground">Something went wrong: {error.message}</div>
  ),
});

function PanditProfile() {
  const { id } = Route.useParams();
  const { pandits: dbPandits, loading } = usePandits();
  const { isSaved, toggle } = useSavedPandits();
  const ratings = usePanditRatings();
  const { t } = useI18n();
  const pandit = dbPandits.find((p) => p.id === id);
  if (!pandit) {
    if (loading) {
      return (
        <MobileShell>
          <div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
        </MobileShell>
      );
    }
    throw notFound();
  }
  const saved = isSaved(pandit.id);
  const r = ratings[pandit.id];

  const offered = poojas.filter((p) => pandit.poojaSlugs.includes(p.slug));

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <BackButton fallback="/pandits" className="h-8 w-8 bg-transparent hover:bg-muted" iconClassName="h-5 w-5" />
          <h1 className="flex-1 text-sm font-semibold">{t("pdt.profile")}</h1>
          <button
            onClick={() => {
              const next = toggle(pandit.id);
              toast.success(next ? t("pdt.savedToast") : t("pdt.removedToast"));
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
              saved ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
            }`}
            aria-label={saved ? "Unsave pandit" : "Save pandit"}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-5">
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-start gap-4">
            {pandit.photoUrl ? (
              <img src={pandit.photoUrl} alt={pandit.name} className="h-20 w-20 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-secondary-foreground">
                {pandit.initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-lg font-bold">{pandit.name}</h2>
                <ShieldCheck className="h-4 w-4 text-accent" />
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {pandit.city}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                {r?.count ? (
                  <>
                    <span className="inline-flex items-center gap-0.5 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {r.avg.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">({r.count} {t("pdt.reviewsSuffix")})</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{t("pdt.newOnPranam")}</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat icon={<Award className="h-3.5 w-3.5" />} label={t("pdt.experience")} value={`${pandit.experience} ${t("pandits.years")}`} />
            <Stat icon={<Languages className="h-3.5 w-3.5" />} label={t("pdt.languages")} value={`${pandit.languages.length}`} />
            <Stat icon={<Calendar className="h-3.5 w-3.5" />} label={t("pdt.feeFrom")} value={`₹${pandit.feeFrom.toLocaleString("en-IN")}`} />
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold">{t("pdt.about")}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pandit.bio}</p>
      </section>

      {/* Languages */}
      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold">{t("pdt.languages")}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pandit.languages.map((l) => (
            <span key={l} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">{l}</span>
          ))}
        </div>
      </section>

      {/* Specialties */}
      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold">{t("pdt.specialties")}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pandit.specialties.map((s) => (
            <span key={s} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{s}</span>
          ))}
        </div>
      </section>

      {/* Poojas offered */}
      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold">{t("pdt.performs")}</h3>
        <div className="mt-3 space-y-2">
          {offered.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("pdt.noPoojas")}</p>
          ) : offered.map((p) => (
            <Link key={p.slug} to="/poojas/$slug" params={{ slug: p.slug }} search={{ pandit: pandit.id }} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
              <img src={p.image} alt={p.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">From ₹{p.priceFrom.toLocaleString("en-IN")} · {p.duration}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="px-5 pb-6 pt-7">
        <h3 className="pb-3 text-sm font-semibold">{t("pdt.ratingsReviews")}</h3>
        <ReviewModule targetKind="pandit" targetId={pandit.id} source="profile" />
      </section>

      {/* Sticky CTA */}
      <div className="sticky bottom-16 mx-5 mb-3 rounded-full border border-border/60 bg-card p-1.5 shadow-soft">
        <Link
          to="/poojas"
          className="flex items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          {t("pd.bookNamed").replace("{name}", pandit.name.split(" ").slice(-1)[0])}
        </Link>
      </div>
    </MobileShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-2">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
