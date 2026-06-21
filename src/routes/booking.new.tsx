import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { MobileShell } from "@/components/MobileShell";
import { poojas, pandits } from "@/lib/data";
import { ArrowLeft, Calendar, Check, Clock, MapPin, ShieldCheck, Wallet } from "lucide-react";

const searchSchema = z.object({
  slug: z.string(),
  pandit: z.string().optional(),
  muhurat: z.string().optional(),
});

export const Route = createFileRoute("/booking/new")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Confirm booking — Pranam" }] }),
  component: BookingCheckout,
});

function BookingCheckout() {
  const { slug, pandit: panditId, muhurat } = Route.useSearch();
  const navigate = useNavigate();
  const pooja = poojas.find((p) => p.slug === slug);
  const pandit = panditId ? pandits.find((p) => p.id === panditId) : undefined;
  const [pay, setPay] = useState<"upi" | "cod" | "wallet">("upi");
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    setTimeout(() => navigate({ to: "/bookings" }), 700);
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link to="/poojas/$slug" params={{ slug }} className="rounded-full p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
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
              <Chip icon={<Calendar className="h-3 w-3" />} text={muhurat || "Pick muhurat with pandit"} />
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
        <h3 className="text-sm font-semibold">Samagri</h3>
        <p className="mt-1 text-xs text-muted-foreground">Pandit will bring the standard kit. You can also order a curated kit or bring your own — manage from <Link to="/samagri" className="text-primary underline">samagri</Link> after booking.</p>
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
        <button
          disabled={submitting}
          onClick={onPay}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {submitting ? "Confirming…" : `Pay ₹${total.toLocaleString("en-IN")} & confirm`}
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
