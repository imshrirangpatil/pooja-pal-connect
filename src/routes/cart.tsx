import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Pranam" },
      { name: "description", content: "Review your samagri order and checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();

  return (
    <MobileShell>
      <TopBar
        title="Your Cart"
        subtitle={cart.count > 0 ? `${cart.count} item${cart.count > 1 ? "s" : ""}` : "Empty"}
        right={
          <BackButton fallback="/samagri" className="h-10 w-10 border border-border bg-card" />
        }
      />

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 pt-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add samagri kits and essentials to get started.</p>
          <Button asChild className="mt-6 bg-primary text-primary-foreground shadow-glow">
            <Link to="/samagri">Browse Store</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 px-5 pt-5">
            {cart.items.map(({ item, qty }) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-secondary to-marigold/30">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-semibold">{item.name}</h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        cart.remove(item.id);
                        toast(`${item.name} removed`);
                      }}
                      aria-label="Remove"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-sm font-bold text-accent">₹{item.price * qty}</p>
                    <div className="flex items-center gap-1.5 rounded-full border border-border bg-background p-0.5">
                      <button
                        onClick={() => cart.setQty(item.id, qty - 1)}
                        aria-label="Decrease"
                        className="flex h-7 w-7 items-center justify-center rounded-full active:scale-95"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-5 text-center text-xs font-semibold">{qty}</span>
                      <button
                        onClick={() => cart.add(item.id)}
                        aria-label="Increase"
                        className="flex h-7 w-7 items-center justify-center rounded-full active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-5 mt-5 flex items-center gap-2 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
            <Truck className="h-4 w-4 text-accent" />
            {cart.subtotal >= 499 ? (
              <span>You've unlocked <strong>free delivery</strong>.</span>
            ) : (
              <span>Add <strong>₹{499 - cart.subtotal}</strong> more for free delivery.</span>
            )}
          </div>

          <div className="mx-5 mt-4 space-y-2 rounded-2xl border border-border/60 bg-card p-4 text-sm shadow-soft">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>₹{cart.subtotal}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>{cart.shipping === 0 ? "FREE" : `₹${cart.shipping}`}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span><span className="text-accent">₹{cart.total}</span>
            </div>
          </div>

          <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-card/95 p-4 backdrop-blur-xl">
            <Button
              onClick={() => navigate({ to: "/checkout" })}
              className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground shadow-glow"
            >
              Checkout · ₹{cart.total}
            </Button>
          </div>
        </>
      )}
    </MobileShell>
  );
}
