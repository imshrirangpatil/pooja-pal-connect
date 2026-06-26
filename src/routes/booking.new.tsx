import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { MobileShell } from "@/components/MobileShell";
import { BackButton } from "@/components/BackButton";
import { poojas, pandits } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { Calendar, Check, Clock, MapPin, ShieldCheck, Wallet, LogIn, Plus } from "lucide-react";

type Addr = {
  id: string; label: string; recipient_name: string; phone: string;
  line1: string; line2: string | null; city: string; state: string; pincode: string; landmark: string | null;
};

// Bookings open a few days out so the samagri kit can reach the home in time.
const MIN_LEAD_DAYS = 3;
const MAX_LEAD_DAYS = 60;

const SLOTS = [
  { id: "morning", label: "Morning", time: "8:00 AM", hour: 8 },
  { id: "midday", label: "Midday", time: "12:00 PM", hour: 12 },
  { id: "evening", label: "Evening", time: "6:00 PM", hour: 18 },
  { id: "flexible", label: "Flexible", time: "Pandit suggests", hour: -1 },
] as const;
type SlotId = (typeof SLOTS)[number]["id"];

function toLocalISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseLocalDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const searchSchema = z.object({
  slug: z.string(),
  pandit: z.string().optional(),
  muhurat: z.string().optional(),
});

export const Route = createFileRoute("/booking/new")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Confirm booking - Pranam" }] }),
  component: BookingCheckout,
});

function BookingCheckout() {
  const { slug, pandit: panditId } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const pooja = poojas.find((p) => p.slug === slug);
  const pandit = panditId ? pandits.find((p) => p.id === panditId) : undefined;
  const [pay, setPay] = useState<"upi" | "cod" | "wallet">("upi");
  const [submitting, setSubmitting] = useState(false);
  const [addr, setAddr] = useState<Addr | null>(null);
  const [addrLoading, setAddrLoading] = useState(true);
  const [dateStr, setDateStr] = useState(() => toLocalISO(addDays(MIN_LEAD_DAYS)));
  const [slotId, setSlotId] = useState<SlotId>("morning");

  const slot = SLOTS.find((s) => s.id === slotId)!;
  const dateObj = parseLocalDate(dateStr);
  const scheduledAt = slot.hour >= 0
    ? new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), slot.hour, 0)
    : null;
  const dateLabel = dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const muhuratLabel = slot.hour >= 0 ? `${dateLabel} · ${slot.label}, ${slot.time}` : `${dateLabel} · flexible time`;

  useEffect(() => {
    if (!user) { setAddrLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      setAddr(((data ?? [])[0] as Addr) ?? null);
      setAddrLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const qc = useQueryClient();
  const { data: balancePaise = 0 } = useQuery({
    queryKey: ["credit-balance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_credit_balance", { _user_id: user!.id });
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });

  if (!pooja) {
    return (
      <MobileShell>
        <div className="p-8 text-center text-sm text-muted-foreground">
          Pooja not found.{" "}
          <Link to="/poojas" className="text-primary underline">Browse poojas</Link>
        </div>
      </MobileShell>
    );
  }

  const samagri = 0; // covered by pandit kit by default
  const fee = pandit?.feeFrom ?? pooja.priceFrom;
  const total = fee + samagri;

  const onPay = async () => {
    if (!user) {
      navigate({ to: "/welcome" });
      return;
    }
    if (!addr) {
      toast.error("Please add a delivery address first");
      navigate({ to: "/addresses", search: { redirect: "/bookings" } as never });
      return;
    }
    const walletPaise = total * 100;
    if (pay === "wallet" && balancePaise < walletPaise) {
      toast.error("Your wallet balance is not enough for this booking");
      return;
    }
    setSubmitting(true);
    try {
      // Match the chosen static pandit to a real pandit row by name, so the
      // booking is attributed for earnings and the pandit's own bookings view.
      let dbPanditId: string | null = null;
      if (pandit) {
        const { data: pr } = await supabase.from("pandits").select("id").eq("name", pandit.name).limit(1).maybeSingle();
        dbPanditId = (pr as { id: string } | null)?.id ?? null;
      }
      const { data: order, error } = await (supabase.from("orders") as any)
        .insert({
          user_id: user.id,
          subtotal: fee,
          shipping: 0,
          total,
          payment_method: pay,
          payment_status: pay === "wallet" ? "paid" : "pending",
          status: "placed",
          pandit_id: dbPanditId,
          credits_applied: pay === "wallet" ? walletPaise : 0,
          address_label: addr.label,
          recipient_name: addr.recipient_name,
          phone: addr.phone,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          landmark: addr.landmark,
          pooja_slug: pooja.slug,
          pooja_name: pooja.name,
          pandit_name: pandit?.name ?? null,
          pandit_ref: pandit?.id ?? null,
          muhurat: muhuratLabel,
          scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
          notes: `Pooja booking: ${pooja.name}${pandit ? " with " + pandit.name : ""}`,
        })
        .select("id")
        .single();
      if (error || !order) throw error ?? new Error("Could not create booking");
      if (pay === "wallet") {
        const { error: redeemErr } = await (supabase as any).rpc("redeem_credits", {
          _amount_paise: walletPaise,
          _description: `Booking ${order.id}`,
        });
        if (redeemErr) console.error("[booking] redeem failed", redeemErr);
        qc.invalidateQueries({ queryKey: ["credit-balance", user.id] });
      }
      haptic([12, 30, 12]);
      toast.success("Booking confirmed. We will reach out to schedule.");
      navigate({ to: "/bookings" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <BackButton fallback="/poojas" className="h-8 w-8 bg-transparent hover:bg-muted" />
          <h1 className="text-sm font-semibold">Confirm & pay</h1>
        </div>
      </header>

      <section className="px-5 pt-5">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
          <img src={pooja.image} alt={pooja.name} className="h-36 w-full object-cover" />
          <div className="p-4">
            <h2 className="text-base font-bold">{pooja.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{pooja.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <Chip icon={<Clock className="h-3 w-3" />} text={pooja.duration} />
              <Chip icon={<Calendar className="h-3 w-3" />} text={muhuratLabel} />
              <Chip icon={<ShieldCheck className="h-3 w-3" />} text="Verified" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold">Pandit</h3>
        {pandit ? (
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">{pandit.initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{pandit.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {pandit.city} · {pandit.experience}y · ⭐ {pandit.rating}
              </p>
            </div>
            <Link to="/pandits/$id" params={{ id: pandit.id }} className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-secondary-foreground">View</Link>
          </div>
        ) : (
          <div className="mt-2 rounded-2xl border border-dashed border-border bg-card p-3 text-xs text-muted-foreground">
            Auto-assigning best-matched pandit. <Link to="/pandits" className="text-primary underline">Choose manually</Link>
          </div>
        )}
      </section>

      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold">Choose date & time</h3>
        <p className="mt-1 text-xs text-muted-foreground">Bookings open {MIN_LEAD_DAYS} days out so your samagri kit arrives in time.</p>
        <input
          type="date"
          min={toLocalISO(addDays(MIN_LEAD_DAYS))}
          max={toLocalISO(addDays(MAX_LEAD_DAYS))}
          value={dateStr}
          onChange={(e) => e.target.value && setDateStr(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-soft"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SLOTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSlotId(s.id)}
              className={`rounded-xl border p-2.5 text-left transition ${slotId === s.id ? "border-primary bg-secondary shadow-glow" : "border-border bg-card"}`}
            >
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.time}</p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Free cancellation up to 24 hours before your chosen time. Eligible refunds return to your Pranam wallet.</p>
      </section>

      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold">Samagri</h3>
        <p className="mt-1 text-xs text-muted-foreground">Pandit will bring the standard kit. You can also order a curated kit or bring your own - manage from <Link to="/samagri" className="text-primary underline">samagri</Link> after booking.</p>
      </section>

      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold">Bill summary</h3>
        <div className="mt-2 space-y-1.5 rounded-2xl border border-border/60 bg-card p-4 text-sm shadow-soft">
          <Row label="Pandit dakshina" value={`₹${fee.toLocaleString("en-IN")}`} />
          <Row label="Samagri" value={samagri ? `₹${samagri}` : "Included"} />
          <div className="my-2 border-t border-border/60" />
          <Row label="Total" value={`₹${total.toLocaleString("en-IN")}`} bold />
        </div>
      </section>

      <section className="px-5 pt-5 pb-32">
        <h3 className="text-sm font-semibold">Payment method</h3>
        <div className="mt-2 space-y-2">
          <PayOption id="upi" label="UPI / Cards / Netbanking" current={pay} onSelect={setPay} icon={<Wallet className="h-4 w-4" />} />
          <PayOption id="wallet" label="Pranam wallet credits" current={pay} onSelect={setPay} icon={<Wallet className="h-4 w-4" />} />
          <PayOption id="cod" label="Pay after pooja" current={pay} onSelect={setPay} icon={<Check className="h-4 w-4" />} />
        </div>
      </section>

      <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur-xl">
        {!user ? (
          <p className="mb-2 inline-flex w-full items-center justify-center gap-1 text-[11px] text-muted-foreground"><LogIn className="h-3 w-3" /> Sign in to confirm your booking.</p>
        ) : !addrLoading && !addr ? (
          <p className="mb-2 inline-flex w-full items-center justify-center gap-1 text-[11px] text-muted-foreground"><Plus className="h-3 w-3" /> Add a delivery address to confirm.</p>
        ) : null}
        <button
          disabled={submitting}
          onClick={onPay}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {submitting
            ? "Confirming…"
            : !user
              ? "Sign in to confirm"
              : !addrLoading && !addr
                ? "Add address to confirm"
                : `Pay ₹${total.toLocaleString("en-IN")} & confirm`}
        </button>
      </div>
    </MobileShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
      {icon} {text}
    </span>
  );
}

function PayOption({ id, label, current, onSelect, icon }: { id: "upi" | "cod" | "wallet"; label: string; current: string; onSelect: (v: any) => void; icon: React.ReactNode }) {
  const active = current === id;
  return (
    <button onClick={() => onSelect(id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm ${active ? "border-primary bg-secondary" : "border-border bg-card"}`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {active && <Check className="h-4 w-4 text-primary" />}
    </button>
  );
}
