import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { samagri } from "@/lib/data";
import samagriHero from "@/assets/samagri-hero.jpg.asset.json";
import { useCart } from "@/lib/cart";
import { ShoppingCart, Plus, Minus, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/samagri")({
  head: () => ({
    meta: [
      { title: "Samagri Store — Pranam" },
      { name: "description", content: "Curated pooja kits, agarbatti, diyas and havan samagri — delivered." },
    ],
  }),
  component: Samagri,
});

function Samagri() {
  const cart = useCart();
  const qtyOf = (id: string) => cart.items.find((i) => i.item.id === id)?.qty ?? 0;

  return (
    <MobileShell>
      <TopBar
        title="Samagri Store"
        subtitle="Curated by pandits"
        right={
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <ShoppingCart className="h-4 w-4" />
            {cart.count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                {cart.count}
              </span>
            )}
          </Link>
        }
      />

      <div className="mx-5 mt-4 overflow-hidden rounded-2xl border border-border/60 shadow-soft">
        <img
          src={samagriHero.url}
          alt="Pranam premium samagri kit with kumkum, haldi, akshat, ganga jal, kesar, panchamrit, camphor, rudraksha and incense sticks"
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
        <Truck className="h-4 w-4 text-accent" />
        <span><strong>Free delivery</strong> on orders over ₹499. Same-day in metros.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pt-5">
        {samagri.map((s) => {
          const qty = qtyOf(s.id);
          return (
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
                  {qty === 0 ? (
                    <button
                      onClick={() => {
                        cart.add(s.id);
                        toast.success(`${s.name} added to cart`);
                      }}
                      aria-label={`Add ${s.name} to cart`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-warm text-primary-foreground shadow-glow transition-transform active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-warm p-0.5 text-primary-foreground shadow-glow">
                      <button
                        onClick={() => cart.setQty(s.id, qty - 1)}
                        aria-label="Decrease"
                        className="flex h-7 w-7 items-center justify-center rounded-full active:scale-95"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-4 text-center text-xs font-semibold">{qty}</span>
                      <button
                        onClick={() => cart.add(s.id)}
                        aria-label="Increase"
                        className="flex h-7 w-7 items-center justify-center rounded-full active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </MobileShell>
  );
}
