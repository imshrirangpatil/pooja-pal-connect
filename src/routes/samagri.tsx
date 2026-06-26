import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { samagri as staticSamagri, type Samagri } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import samagriHero from "@/assets/samagri-hero.jpg.asset.json";
import samagriDiwali from "@/assets/samagri-diwali.jpg";
import { useCart } from "@/lib/cart";
import { ShoppingCart, Plus, Minus, Truck, Package, Sparkles, Gem, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/samagri")({
  head: () => ({
    meta: [
      { title: "Samagri Store - Pranam" },
      { name: "description", content: "Pooja kits, individual samagri, rudraksh & blessed items - delivered." },
    ],
  }),
  component: Samagri,
});

type Cat = "all" | "kit" | "samagri" | "blessed";

type StoreItem = Samagri & { category: Cat extends "all" ? never : "kit" | "samagri" | "blessed" };

const TABS: { key: Cat; label: string; icon: typeof Package }[] = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "kit", label: "Kits", icon: Package },
  { key: "samagri", label: "Samagri", icon: Sparkles },
  { key: "blessed", label: "Blessed", icon: Gem },
];

function Samagri() {
  const cart = useCart();
  const [tab, setTab] = useState<Cat>("all");
  const qtyOf = (id: string) => cart.items.find((i) => i.item.id === id)?.qty ?? 0;

  const { data: dbSkus = [] } = useQuery({
    queryKey: ["store-skus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_skus")
        .select("*")
        .eq("active", true)
        .order("sort_order").order("name");
      if (error) throw error;
      return data;
    },
  });

  const items = useMemo<StoreItem[]>(() => {
    const fromDb: StoreItem[] = dbSkus.map((s: any) => ({
      id: s.id,
      name: s.name,
      desc: s.description ?? "",
      price: Math.round(s.price_paise / 100),
      mrp: Math.round(s.mrp_paise / 100),
      image: s.image_url || samagriDiwali,
      category: s.category,
    }));
    // Treat the seed static items as kits if no DB SKUs exist yet, so the store isn't empty.
    if (fromDb.length === 0) {
      return staticSamagri.map((s) => ({
        ...s,
        category: /kit/i.test(s.name) ? "kit" : "samagri",
      })) as StoreItem[];
    }
    return fromDb;
  }, [dbSkus]);

  const filtered = tab === "all" ? items : items.filter((i) => i.category === tab);

  return (
    <MobileShell>
      <TopBar
        title="Samagri Store"
        subtitle="Curated by pandits"
        right={
          <Link
            to="/cart"
            aria-label={cart.count > 0 ? `View cart, ${cart.count} item${cart.count === 1 ? "" : "s"}` : "View cart"}
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

      <nav className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          const count = t.key === "all" ? items.length : items.filter((i) => i.category === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              <span className={`ml-0.5 rounded-full px-1.5 text-[10px] ${active ? "bg-primary-foreground/20" : "bg-background/60"}`}>{count}</span>
            </button>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <div className="mx-5 mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No items in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 pt-4">
          {filtered.map((s) => {
            const qty = qtyOf(s.id);
            return (
              <article key={s.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary to-marigold/30">
                  <img src={s.image} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold">{s.name}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{s.desc}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-accent">₹{s.price}</p>
                      {s.mrp > s.price && <p className="text-[10px] text-muted-foreground line-through">₹{s.mrp}</p>}
                    </div>
                    {qty === 0 ? (
                      <button
                        onClick={() => {
                          cart.add({ id: s.id, name: s.name, desc: s.desc, price: s.price, mrp: s.mrp, image: s.image });
                          haptic();
                          toast.success(`${s.name} added to cart`);
                        }}
                        aria-label={`Add ${s.name} to cart`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full bg-primary p-0.5 text-primary-foreground shadow-glow">
                        <button onClick={() => cart.setQty(s.id, qty - 1)} aria-label="Decrease" className="flex h-7 w-7 items-center justify-center rounded-full active:scale-95">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-4 text-center text-xs font-semibold">{qty}</span>
                        <button onClick={() => cart.add({ id: s.id, name: s.name, desc: s.desc, price: s.price, mrp: s.mrp, image: s.image })} aria-label="Increase" className="flex h-7 w-7 items-center justify-center rounded-full active:scale-95">
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
      )}
    </MobileShell>
  );
}
