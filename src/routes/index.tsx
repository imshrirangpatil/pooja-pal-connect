import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { festivals, pandits } from "@/lib/data";
import { usePoojas } from "@/lib/poojas-source";
import { Search, MapPin, Bell, ShieldCheck, Sparkles, Flame, ShoppingBag, ChevronRight, Star, Zap, Package, Hand } from "lucide-react";
import heroImg from "@/assets/hero-pooja.jpg";
import astroImg from "@/assets/cat-astrology.jpg";
import samagriImg from "@/assets/cat-samagri.jpg";
import panditImg from "@/assets/cat-pandit.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pranam — Book Pandit & Pooja, Astrology on demand" },
      { name: "description", content: "Verified pandits, full samagri delivered, astrology consults — every ritual, made easy." },
    ],
  }),
  component: Home,
});

function Home() {
  const { poojas } = usePoojas();
  return (
    <MobileShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroImg} alt="Sacred pooja ritual" width={1024} height={1280} className="absolute inset-0 h-[420px] w-full object-cover" />
        <div className="absolute inset-0 h-[420px] bg-gradient-to-b from-maroon/70 via-maroon/40 to-background" />
        <div className="relative px-5 pb-6 pt-6 text-cream">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-medium">Mumbai, MH</span>
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Bell className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-16">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-marigold/90">Namaste 🙏</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-balance">
              Every ritual,<br />done right.
            </h1>
            <p className="mt-2 max-w-xs text-sm text-cream/85">
              Verified pandits, samagri at your door, astrology in your pocket.
            </p>
          </div>

          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search pooja, pandit or astrologer…"
              className="h-12 w-full rounded-full border border-border/40 bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-5 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <CategoryCard to="/poojas" img={panditImg} label="Book Pandit" sub="Verified, on schedule" />
          <CategoryCard to="/astrology" img={astroImg} label="Astrology" sub="Live chat & call" tone="dark" />
          <CategoryCard to="/samagri" img={samagriImg} label="Samagri" sub="Free delivery" />
          <CategoryCard to="/pandits" img={panditImg} label="Pandits" sub={`${pandits.length}+ verified`} />
        </div>
      </section>

      {/* Direct booking shortcut */}
      <section className="mx-5 mt-6 overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Zap className="h-3.5 w-3.5" /> Know your pooja already?
        </div>
        <h3 className="mt-2 text-lg font-bold leading-tight">Pick a pandit, pick a pooja, book in 60 seconds.</h3>
        <p className="mt-1 text-xs text-muted-foreground">Skip the browsing — your pandit will call you to confirm timing and details.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/pandits" className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground">
            Choose pandit <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link to="/poojas" className="flex items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-card py-2.5 text-xs font-semibold text-primary">
            Choose pooja <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 rounded-2xl bg-card p-3 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground">For samagri, you choose:</p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-start gap-2"><Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Order the curated kit on Pranam</li>
            <li className="flex items-start gap-2"><ShoppingBag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Order individual items from our store</li>
            <li className="flex items-start gap-2"><Hand className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Or bring your own — pandit will guide you</li>
          </ul>
        </div>
      </section>


      {/* Festival strip */}
      <section className="mt-7 px-5">
        <SectionHeader title="Festivals & Muhurat" icon={<Flame className="h-4 w-4" />} action="See all" to="/festivals" />
        <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {festivals.map((f) => (
            <div key={f.name} className={`min-w-[160px] rounded-2xl ${f.color} p-4 text-secondary-foreground shadow-soft`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">{f.date}</p>
              <p className="mt-2 text-lg font-bold leading-tight">{f.name}</p>
              <p className="mt-3 text-xs opacity-90">{f.days === 0 ? "Today" : `In ${f.days} days`}</p>
            </div>
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

      {/* Trust band */}
      <section className="mx-5 mt-7 rounded-3xl bg-secondary p-5 text-secondary-foreground shadow-glow">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6" />
          <div>
            <h3 className="text-lg font-bold">Every pandit, personally verified</h3>
            <p className="mt-1 text-sm text-secondary-foreground/90">
              Aadhaar, lineage, shastra knowledge and on-ground review by senior acharyas.
            </p>
          </div>
        </div>
        <Link to="/pandits" className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur">
          Meet our pandits <ChevronRight className="h-3.5 w-3.5" />
        </Link>
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
        🪔 Made with devotion in India
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
