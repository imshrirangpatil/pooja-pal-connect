import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Plus, Check, Wallet, Banknote } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Pranam" },
      { name: "description", content: "Confirm your delivery address and place your samagri order." },
    ],
  }),
  component: CheckoutPage,
});

type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
};

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [payment, setPayment] = useState<"cod" | "wallet">("cod");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/signup", search: { redirect: "/checkout" } as never });
      return;
    }
    if (cart.items.length === 0) {
      navigate({ to: "/cart" });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
      } else {
        setAddresses(data ?? []);
        const def = (data ?? []).find((a) => a.is_default) ?? (data ?? [])[0];
        if (def) setSelectedId(def.id);
      }
      setLoading(false);
    })();
  }, [authLoading, user, cart.items.length, navigate]);

  const placeOrder = async () => {
    if (!user) return;
    const addr = addresses.find((a) => a.id === selectedId);
    if (!addr) {
      toast.error("Please select a delivery address");
      return;
    }
    setPlacing(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          subtotal: cart.subtotal,
          shipping: cart.shipping,
          total: cart.total,
          payment_method: payment,
          payment_status: payment === "wallet" ? "paid" : "pending",
          status: "placed",
          address_label: addr.label,
          recipient_name: addr.recipient_name,
          phone: addr.phone,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          landmark: addr.landmark,
        })
        .select("id")
        .single();
      if (error || !order) throw error ?? new Error("Failed to create order");

      const lines = cart.items.map(({ item, qty }) => ({
        order_id: order.id,
        samagri_id: item.id,
        name: item.name,
        emoji: item.image,
        unit_price: item.price,
        qty,
        line_total: item.price * qty,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(lines);
      if (itemsError) throw itemsError;

      cart.clear();
      toast.success("Order placed! We'll notify you when it's on the way.");
      navigate({ to: "/orders" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not place order";
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <MobileShell>
      <TopBar
        title="Checkout"
        subtitle={`${cart.count} item${cart.count === 1 ? "" : "s"} · ₹${cart.total}`}
        right={
          <BackButton fallback="/cart" className="h-10 w-10 border border-border bg-card" />
        }
      />

      <section className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Delivery Address</h2>
          <Link
            to="/addresses"
            search={{ redirect: "/checkout" } as never}
            className="text-xs font-semibold text-accent"
          >
            Manage
          </Link>
        </div>

        {loading ? (
          <div className="mt-3 h-24 animate-pulse rounded-2xl bg-secondary/60" />
        ) : addresses.length === 0 ? (
          <Link
            to="/addresses"
            search={{ redirect: "/checkout" } as never}
            className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4 text-sm shadow-soft"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-accent">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold">Add delivery address</p>
              <p className="text-xs text-muted-foreground">Required to place order</p>
            </div>
          </Link>
        ) : (
          <div className="mt-3 space-y-2">
            {addresses.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`flex w-full items-start gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-soft transition-colors ${
                  selectedId === a.id ? "border-primary ring-1 ring-primary" : "border-border/60"
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{a.label}</span>
                    {a.is_default && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.recipient_name} · {a.phone}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-foreground/80">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                  </p>
                </div>
                {selectedId === a.id && (
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 pt-5">
        <h2 className="text-sm font-semibold">Payment Method</h2>
        <div className="mt-3 space-y-2">
          <PayOption
            active={payment === "cod"}
            onClick={() => setPayment("cod")}
            icon={<Banknote className="h-4 w-4" />}
            title="Cash on Delivery"
            sub="Pay when your order arrives"
          />
          <PayOption
            active={payment === "wallet"}
            onClick={() => setPayment("wallet")}
            icon={<Wallet className="h-4 w-4" />}
            title="Pranam Wallet"
            sub="Balance: ₹250"
          />
        </div>
      </section>

      <section className="mx-5 mt-5 space-y-2 rounded-2xl border border-border/60 bg-card p-4 text-sm shadow-soft">
        <h2 className="text-sm font-semibold">Order Summary</h2>
        <div className="mt-1 space-y-1.5 text-xs">
          {cart.items.map(({ item, qty }) => (
            <div key={item.id} className="flex justify-between text-muted-foreground">
              <span className="line-clamp-1 pr-2">
                {item.name} × {qty}
              </span>
              <span className="text-foreground">₹{item.price * qty}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-muted-foreground">
          <span>Subtotal</span>
          <span>₹{cart.subtotal}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery</span>
          <span>{cart.shipping === 0 ? "FREE" : `₹${cart.shipping}`}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
          <span>Total</span>
          <span className="text-accent">₹{cart.total}</span>
        </div>
      </section>

      <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-card/95 p-4 backdrop-blur-xl">
        <Button
          onClick={placeOrder}
          disabled={placing || !selectedId || cart.items.length === 0}
          className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground shadow-glow"
        >
          {placing ? "Placing order…" : `Place Order · ₹${cart.total}`}
        </Button>
      </div>
    </MobileShell>
  );
}

function PayOption({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-soft transition-colors ${
        active ? "border-primary ring-1 ring-primary" : "border-border/60"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-accent">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {active && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}
