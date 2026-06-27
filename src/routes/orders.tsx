import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { Package, Clock, RotateCcw } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { PullToRefresh } from "@/components/PullToRefresh";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders - Pranam" },
      { name: "description", content: "Track your samagri orders." },
    ],
  }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  created_at: string;
  city: string;
  state: string;
  order_items: { id: string; samagri_id: string; name: string; emoji: string | null; qty: number; unit_price: number }[];
};

function statusColor(status: string) {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "shipped":
    case "out_for_delivery":
      return "bg-blue-100 text-blue-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-secondary text-accent";
  }
}

// The journey a samagri order travels, in order. The order's current status
// lights up this step and everything before it.
const DELIVERY_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out" },
  { key: "delivered", label: "Delivered" },
] as const;

function DeliverySteps({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
        This order was cancelled. Any credits used have been refunded.
      </p>
    );
  }
  const current = Math.max(0, DELIVERY_STEPS.findIndex((s) => s.key === status));
  return (
    <div className="mt-3 flex items-center">
      {DELIVERY_STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done ? "bg-primary" : "bg-border"}`} />
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${done ? "bg-primary" : "bg-border"}`} />
              <span className={`h-0.5 flex-1 ${i === DELIVERY_STEPS.length - 1 ? "opacity-0" : i < current ? "bg-primary" : "bg-border"}`} />
            </div>
            <span className={`mt-1 text-[9px] ${done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function OrdersPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const cart = useCart();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, payment_method, payment_status, total, created_at, city, state, order_items(id, samagri_id, name, emoji, qty, unit_price)")
      .order("created_at", { ascending: false });
    if (!error) setOrders((data as OrderRow[]) ?? []);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/signup" });
      return;
    }
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, navigate]);

  const reorder = (o: OrderRow) => {
    for (const it of o.order_items ?? []) {
      cart.add({ id: it.samagri_id, name: it.name, desc: "", price: it.unit_price, mrp: it.unit_price, image: it.emoji ?? "" });
      cart.setQty(it.samagri_id, it.qty);
    }
    haptic();
    toast.success("Added to cart");
    navigate({ to: "/cart" });
  };

  return (
    <MobileShell>
      <TopBar
        title="My Orders"
        subtitle={orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"}` : "Samagri & essentials"}
        right={
          <BackButton fallback="/profile" className="h-10 w-10 border border-border bg-card" />
        }
      />

      <PullToRefresh onRefresh={load}>
      <div className="px-5 pt-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
            <div className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Package className="h-8 w-8 text-accent" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No orders yet</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Browse the samagri store and your orders will show up here.
            </p>
            <Link
              to="/samagri"
              className="mt-4 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow"
            >
              Open store
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const items = o.order_items ?? [];
              const totalQty = items.reduce((n, i) => n + i.qty, 0);
              const placedAt = new Date(o.created_at);
              return (
                <article
                  key={o.id}
                  className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${statusColor(o.status)}`}>
                      {o.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-accent">₹{o.total.toLocaleString("en-IN")}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold">
                    {totalQty} item{totalQty === 1 ? "" : "s"} · {items.slice(0, 2).map((i) => i.name).join(", ")}
                    {items.length > 2 ? `, +${items.length - 2} more` : ""}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Delivering to {o.city}, {o.state}
                  </p>
                  <DeliverySteps status={o.status} />
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {placedAt.toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="capitalize">
                      {o.payment_method === "cod" ? "Cash on delivery" : "Wallet"}
                      {o.payment_status === "paid" ? " · Paid" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => reorder(o)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reorder
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
      </PullToRefresh>
    </MobileShell>
  );
}
