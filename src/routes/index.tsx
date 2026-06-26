import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { pandits } from "@/lib/data";
import { usePoojas } from "@/lib/poojas-source";
import { useUpcomingFestivals } from "@/lib/festivals-source";
import { useUnreadCount } from "@/lib/notifications";
import { useAuth } from "@/lib/auth";
import { useCity, CITIES } from "@/lib/city";
import { Search, MapPin, Bell, Sparkles, Flame, ShoppingBag, ChevronRight, Star, Zap, Video, X, Check } from "lucide-react";
import logoAsset from "@/assets/pranam-logo.png.asset.json";
import heroImg from "@/assets/hero-pooja.jpg";
import astroImg from "@/assets/cat-astrology.jpg";
import samagriImg from "@/assets/cat-samagri.jpg";
import panditImg from "@/assets/cat-pandit.jpg";
import darshanImg from "@/assets/cat-darshan.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pranam - Book Pandit & Pooja, Astrology on demand" },
      { name: "description", content: "Verified pandits, full samagri delivered, astrology consults - every ritual, made easy." },
    ],
  }),
  component: Home,
});

function Home() {
  const { poojas } = usePoojas();
  const { festivals } = useUpcomingFestivals(8);
  const unread = useUnreadCount();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city, setCity } = useCity();
  const [cityOpen, setCityOpen] = useState(false);
  const [search, setSearch] = useState("");
  const runSearch = () => {
    const q = search.trim();
    navigate({ to: "/poojas", search: q ? { q } : {} });
  };

  const fullName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || "";
  const firstName = fullName.trim().split(/\s+/)[0] || "";

  return (
    <MobileShell>
      {cityOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setCityOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto w-full max-w-md rounded-t-3xl bg-card p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold">Choose your city</p>
              <button onClick={() => setCityOpen(false)} aria-label="Close" className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); setCityOpen(false); }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium ${city === c ? "border-primary bg-secondary" : "border-border bg-card"}`}
                >
                  {c} {city === c && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroImg} alt="Sacred pooja ritual" width={1024} height={1280} className="absolute inset-0 h-[420px] w-full object-cover" />
        <div className="absolute inset-0 h-[420px] bg-gradient-to-b from-maroon/70 via-maroon/40 to-background" />
        <div className="relative px-5 pb-6 pt-6 text-cream">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoAsset.url} alt="Pranam" width={32} height={32} className="h-8 w-8 rounded-lg bg-white/90 object-contain p-0.5" />
              <button onClick={() => setCityOpen(true)} className="inline-flex items-center gap-1 text-xs font-medium">
                <MapPin className="h-3.5 w-3.5" /> {city ?? "Set your city"}
                <ChevronRight className="h-3 w-3 rotate-90 opacity-80" />
              </button>
            </div>
            <Link to="/notifications" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>

          <div className="mt-16">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-marigold/90">
              {firstName ? `Namaste ${firstName} 🙏` : "Namaste 🙏"}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-balance">
              Every ritual,<br />done right.
            </h1>
            <p className="mt-2 max-w-xs text-sm text-cream/85">
              Book a pandit, order samagri, or talk to an astrologer.
            </p>
          </div>

          <div className="relative mt-6">
            <button
              type="button"
              onClick={runSearch}
              aria-label="Search"
              className="absolute left-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
              placeholder="Search poojas by name or type…"
              className="h-12 w-full rounded-full border border-border/40 bg-card pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-5 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <CategoryCard to="/darshan" img={darshanImg} label="Live Darshan" sub="Aarti & live pooja" />
          <CategoryCard to="/astrology" img={astroImg} label="Astrology" sub="Live chat & call" tone="dark" />
          <CategoryCard to="/samagri" img={samagriImg} label="Samagri" sub="Free delivery" />
          <CategoryCard to="/pandits" img={panditImg} label="Pandits" sub={`${pandits.length}+ verified`} />
        </div>
      </section>

      {/* Direct booking shortcut */}
      <section className="mx-5 mt-6 overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Zap className="h-3.5 w-3.5" /> Book in a minute
        </div>
        <h3 className="mt-2 text-lg font-bold leading-tight">Choose your pooja, we handle the rest.</h3>
        <p className="mt-1 text-xs text-muted-foreground">A verified pandit calls to confirm timing, and samagri can come with the booking.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/poojas" className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground">
            Browse poojas <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link to="/pandits" className="flex items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-card py-2.5 text-xs font-semibold text-primary">
            Find a pandit <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>


      {/* Festival strip */}
      <section className="mt-7 px-5">
        <SectionHeader title="Festivals & Muhurat" icon={<Flame className="h-4 w-4" />} action="See all" to="/festivals" />
        <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {festivals.map((f) => (
            <Link key={f.id} to="/festivals" className="min-w-[160px] rounded-2xl bg-secondary p-4 text-secondary-foreground shadow-soft">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">{f.label}</p>
              <p className="mt-2 text-lg font-bold leading-tight">{f.name}</p>
              <p className="mt-3 text-xs opacity-90">
                {f.daysFromNow === 0 ? "Today" : f.daysFromNow === 1 ? "Tomorrow" : `In ${f.daysFromNow} days`}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Poojas */}
      <section className="mt-7 px-5">
        <SectionHeader title="Popular poojas" icon={<Sparkles className="h-4 w-4" />} action="View all" to="/poojas" />
        <div className="mt-3 space-y-3">
          {poojas.filter((p) => p.popular).map((p) => (
            <Link key={p.slug} to="/poojas/$slug" params={{ slug: p.slug }} className="block">
              <article className="flex gap-3 rounded-2xl border border-border/60 bg-card p-2.5 shadow-soft">
                <img src={p.image} alt={p.name} width={120} height={120} loading="lazy" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                <div className="flex min-w-0 flex-1 flex-col py-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold leading-tight text-foreground">{p.name}</h3>
                    {p.season && (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {p.season}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.tagline}</p>
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
                      <p className="text-base font-bold text-accent">₹{p.priceFrom.toLocaleString("en-IN")}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{p.duration}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Darshan band */}
      <section className="mx-5 mt-7 overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-soft">
        <div className="relative h-32 w-full">
          <img src={darshanImg} alt="Live aarti darshan from temple" width={768} height={768} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground shadow-soft">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Video className="h-3.5 w-3.5" /> Mandir darshan, anytime
          </div>
          <h3 className="mt-1.5 text-lg font-bold leading-tight">Aarti from Kashi, Tirupati and Mahakal, on your phone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Watch live aarti from India's most sacred temples, or book a private live pooja in your name with prasad delivered home.
          </p>
          <Link to="/darshan" className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
            Open live darshan <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Top pandits */}
      <section className="mt-7 px-5">
        <SectionHeader title="Top pandits near you" action="See all" to="/pandits" />
        <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pandits.slice(0, 4).map((p) => (
            <div key={p.id} className="min-w-[170px] rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
                {p.initials}
              </div>
              <p className="mt-3 line-clamp-1 text-sm font-semibold">{p.name}</p>
              <p className="text-[11px] text-muted-foreground">{p.city} · {p.experience}y</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-semibold">{p.rating}</span>
                <span className="text-muted-foreground">({p.reviews})</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Store CTA */}
      <section className="mx-5 mt-7 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
        <div className="flex">
          <div className="flex-1 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Samagri store</p>
            <h3 className="mt-1 text-lg font-bold leading-tight">Pooja kits, delivered fresh</h3>
            <p className="mt-1 text-xs text-muted-foreground">Curated by pandits. Free over ₹499.</p>
            <Link to="/samagri" className="mt-3 inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">
              <ShoppingBag className="h-3.5 w-3.5" /> Shop now
            </Link>
          </div>
          <img src={samagriImg} alt="Samagri kit" width={400} height={400} loading="lazy" className="h-32 w-32 self-center rounded-2xl object-cover" />
        </div>
      </section>

      <p className="mt-8 px-5 text-center text-[11px] text-muted-foreground">
        Made in India
      </p>
    </MobileShell>
  );
}

function CategoryCard({ to, img, label, sub, tone = "light" }: { to: string; img: string; label: string; sub: string; tone?: "light" | "dark" }) {
  return (
    <Link to={to} className="group relative block aspect-[5/4] overflow-hidden rounded-2xl shadow-soft">
      <img src={img} alt={label} width={500} height={400} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      <div className={`absolute inset-0 bg-gradient-to-t ${tone === "dark" ? "from-maroon/90 via-maroon/40" : "from-foreground/85 via-foreground/30"} to-transparent`} />
      <div className="absolute inset-x-0 bottom-0 p-3 text-cream">
        <p className="text-base font-bold leading-tight">{label}</p>
        <p className="text-[11px] opacity-85">{sub}</p>
      </div>
    </Link>
  );
}

function SectionHeader({ title, icon, action, to }: { title: string; icon?: React.ReactNode; action?: string; to?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </h2>
      {action && to ? (
        <Link to={to} className="flex items-center gap-0.5 text-xs font-medium text-primary">
          {action} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : action ? (
        <button className="flex items-center gap-0.5 text-xs font-medium text-primary">
          {action} <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
