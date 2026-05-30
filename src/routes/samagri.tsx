import { createFileRoute } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { samagri } from "@/lib/data";
import { ShoppingCart, Plus, Truck } from "lucide-react";

export const Route = createFileRoute("/samagri")({
  head: () => ({
    meta: [
      { title: "Samagri Store — Divya" },
      { name: "description", content: "Curated pooja kits, agarbatti, diyas and havan samagri — delivered." },
    ],
  }),
  component: Samagri,
});

function Samagri() {
  return (
    <MobileShell>
      <TopBar
        title="Samagri Store"
        subtitle="Curated by pandits"
        right={
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">2</span>
          </button>
        }
      />

      <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
        <Truck className="h-4 w-4 text-accent" />
        <span><strong>Free delivery</strong> on orders over ₹499. Same-day in metros.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pt-5">
        {samagri.map((s) => (
          <article key={s.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-secondary to-marigold/30 text-5xl">
              {s.emoji}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-1 text-sm font-semibold">{s.name}</h3>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{s.desc}</p>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold text-accent">₹{s.price}</p>
                  <p className="text-[10px] text-muted-foreground line-through">₹{s.mrp}</p>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-warm text-primary-foreground shadow-glow">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </MobileShell>
  );
}
