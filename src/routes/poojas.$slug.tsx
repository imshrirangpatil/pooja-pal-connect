import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { poojas, pandits } from "@/lib/data";
import { ArrowLeft, Check, Clock, Star, ShieldCheck, Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/poojas/$slug")({
  loader: ({ params }) => {
    const pooja = poojas.find((p) => p.slug === params.slug);
    if (!pooja) throw notFound();
    return { pooja };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.pooja
      ? [
          { title: `${loaderData.pooja.name} — Book on Divya` },
          { name: "description", content: loaderData.pooja.description },
          { property: "og:title", content: `${loaderData.pooja.name} — Book on Divya` },
          { property: "og:description", content: loaderData.pooja.description },
          { property: "og:image", content: loaderData.pooja.image },
        ]
      : [],
  }),
  component: PoojaDetail,
  errorComponent: ({ error }) => <div className="p-8 text-center text-sm">Could not load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8 text-center">Pooja not found.</div>,
});

function PoojaDetail() {
  const { pooja } = Route.useLoaderData();

  return (
    <MobileShell>
      <div className="relative">
        <img src={pooja.image} alt={pooja.name} width={1024} height={700} className="h-72 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-background" />
        <Link to="/poojas" className="absolute left-4 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-soft backdrop-blur">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {pooja.season && (
          <span className="absolute right-4 top-5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground shadow-soft">
            ⭐ {pooja.season}
          </span>
        )}
      </div>

      <div className="-mt-8 rounded-t-3xl bg-background px-5 pt-6">
        <h1 className="text-2xl font-bold text-foreground">{pooja.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{pooja.tagline}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip icon={<Clock className="h-3 w-3" />} text={pooja.duration} />
          <Chip icon={<Star className="h-3 w-3 fill-primary text-primary" />} text="4.9 (2.1k)" />
          <Chip icon={<ShieldCheck className="h-3 w-3" />} text="Verified pandit" />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-foreground/90">{pooja.description}</p>

        <h2 className="mt-7 text-base font-semibold">What's included</h2>
        <ul className="mt-3 space-y-2.5">
          {pooja.includes.map((i: string) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-accent">
                <Check className="h-3.5 w-3.5" />
              </span>
              {i}
            </li>
          ))}
        </ul>

        <h2 className="mt-7 text-base font-semibold">Pick a muhurat</h2>
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { d: "Today", t: "Brahma Muhurat · 5:12 AM", hot: true },
            { d: "Tomorrow", t: "Abhijit · 11:48 AM" },
            { d: "Sun, 2 Nov", t: "Vijay · 2:34 PM" },
            { d: "Mon, 3 Nov", t: "Amrit · 7:02 PM" },
          ].map((m) => (
            <button key={m.d} className={`min-w-[160px] rounded-2xl border p-3 text-left ${m.hot ? "border-primary bg-secondary" : "border-border bg-card"}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Calendar className="h-3 w-3" /> {m.d}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.t}</p>
              {m.hot && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-accent">Most auspicious</p>}
            </button>
          ))}
        </div>

        <h2 className="mt-7 text-base font-semibold">Suggested pandits</h2>
        <div className="mt-3 space-y-2.5">
          {pandits.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-warm text-sm font-bold text-primary-foreground">{p.initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {p.city} · {p.experience}y · ⭐ {p.rating}
                </p>
              </div>
              <button className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-secondary-foreground">Pick</button>
            </div>
          ))}
        </div>

        <div className="h-6" />
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-accent">₹{pooja.priceFrom.toLocaleString("en-IN")}</p>
          </div>
          <button className="flex-1 rounded-full bg-gradient-warm py-3.5 text-sm font-semibold text-primary-foreground shadow-glow">
            Book Pandit Now
          </button>
        </div>
      </div>
    </MobileShell>
  );
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-secondary-foreground">
      {icon} {text}
    </span>
  );
}
