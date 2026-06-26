import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { PullToRefresh } from "@/components/PullToRefresh";
import { CalendarCheck, Clock, ChevronRight, Star, X, MapPin, Phone, CreditCard, Calendar, Loader2, LogIn } from "lucide-react";
import { ReviewModule } from "@/components/ReviewModule";
import { toast } from "sonner";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings - Pranam" },
      { name: "description", content: "Track upcoming poojas and past bookings." },
    ],
  }),
  component: Bookings,
});

type OrderRow = {
  id: string;
  pooja_slug: string | null;
  pooja_name: string | null;
  pandit_name: string | null;
  pandit_ref: string | null;
  muhurat: string | null;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
};

type Tab = "Upcoming" | "Completed" | "Cancelled";
const TABS: Tab[] = ["Upcoming", "Completed", "Cancelled"];

function tabFor(status: string): Tab {
  if (status === "cancelled") return "Cancelled";
  if (status === "completed" || status === "delivered") return "Completed";
  return "Upcoming";
}
function bookedOn(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function Bookings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [rating, setRating] = useState<{ panditRef: string; bookingId: string; name: string } | null>(null);
  const [details, setDetails] = useState<OrderRow | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<OrderRow | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("id, pooja_slug, pooja_name, pandit_name, pandit_ref, muhurat, total, status, payment_method, payment_status, recipient_name, phone, line1, line2, city, state, pincode, created_at")
        .not("pooja_slug", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string): Promise<number> => {
      const { error } = await (supabase.from("orders") as any).update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      const { data: refunded } = await (supabase as any).rpc("refund_order_credits", { _order_id: id });
      return (refunded as number) ?? 0;
    },
    onSuccess: (refunded) => {
      qc.invalidateQueries({ queryKey: ["bookings", user?.id] });
      qc.invalidateQueries({ queryKey: ["credit-balance", user?.id] });
      setDetails(null);
      setConfirmCancel(null);
      setTab("Cancelled");
      toast.success(
        refunded > 0
          ? `Booking cancelled. ₹${(refunded / 100).toLocaleString("en-IN")} returned to your wallet.`
          : "Booking cancelled",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = bookings.filter((b) => tabFor(b.status) === tab);

  const refreshBookings = () => qc.invalidateQueries({ queryKey: ["bookings", user?.id] });

  const rebook = (b: OrderRow) => {
    if (b.pooja_slug) navigate({ to: "/poojas/$slug", params: { slug: b.pooja_slug } });
    else navigate({ to: "/poojas" });
  };

  if (!authLoading && !user) {
    return (
      <MobileShell>
        <TopBar title="My Bookings" subtitle="Upcoming & past poojas" />
        <div className="px-5 pt-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-accent">
            <CalendarCheck className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold">Sign in to see your bookings</p>
          <p className="mt-1 text-xs text-muted-foreground">Your poojas sync across devices once you sign in.</p>
          <button
            onClick={() => navigate({ to: "/welcome" })}
            className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <TopBar title="My Bookings" subtitle="Upcoming & past poojas" />

      <PullToRefresh onRefresh={refreshBookings}>
      <div className="px-5 pt-4">
        <div className="flex gap-2 rounded-full border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-xs font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-5 space-y-3">
            <div className="h-28 animate-pulse rounded-2xl bg-secondary/60" />
            <div className="h-28 animate-pulse rounded-2xl bg-secondary/60" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="mt-5 space-y-3">
            {list.map((b) => (
              <article key={b.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tab === "Completed" ? "bg-green-100 text-green-700" : tab === "Cancelled" ? "bg-secondary text-accent" : "bg-amber-100 text-amber-700"}`}>
                    {tab}
                  </span>
                  <span className="text-sm font-bold text-accent">₹{(b.total ?? 0).toLocaleString("en-IN")}</span>
                </div>
                <h3 className="mt-2 text-base font-bold">{b.pooja_name ?? "Pooja booking"}</h3>
                <p className="text-xs text-muted-foreground">{b.pandit_name ? `with ${b.pandit_name}` : "Pandit to be assigned"}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-foreground/80">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {b.muhurat || `Booked ${bookedOn(b.created_at)}`}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setDetails(b)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-full bg-secondary py-2 text-xs font-semibold text-secondary-foreground"
                  >
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  {tab === "Completed" && b.pandit_ref && (
                    <button
                      onClick={() => setRating({ panditRef: b.pandit_ref!, bookingId: b.id, name: b.pandit_name ?? "your pandit" })}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground"
                    >
                      <Star className="h-3.5 w-3.5" /> Rate Pandit
                    </button>
                  )}
                  {tab !== "Upcoming" && (
                    <button
                      onClick={() => rebook(b)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full border border-primary/40 bg-primary/10 py-2 text-xs font-semibold text-primary"
                    >
                      Book again
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      </PullToRefresh>

      {rating && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setRating(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card shadow-soft">
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
              <div>
                <p className="text-base font-bold">Rate {rating.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Help others find the right acharya.</p>
              </div>
              <button onClick={() => setRating(null)} aria-label="Close" className="rounded-full p-2 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <ReviewModule
                targetKind="pandit"
                targetId={rating.panditRef}
                source="booking"
                referenceId={rating.bookingId}
                compact
                onSubmitted={() => setTimeout(() => setRating(null), 600)}
              />
            </div>
          </div>
        </div>
      )}

      {details && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setDetails(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card shadow-soft">
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
              <div>
                <p className="text-base font-bold">Booking details</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Ref: {details.id.slice(0, 8)}</p>
              </div>
              <button onClick={() => setDetails(null)} aria-label="Close" className="rounded-full p-2 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <div className="mt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tabFor(details.status) === "Completed" ? "bg-green-100 text-green-700" : tabFor(details.status) === "Cancelled" ? "bg-secondary text-accent" : "bg-amber-100 text-amber-700"}`}>
                    {tabFor(details.status)}
                  </span>
                  <span className="text-sm font-bold text-accent">₹{(details.total ?? 0).toLocaleString("en-IN")}</span>
                </div>

                {tabFor(details.status) !== "Cancelled" && <BookingSteps status={details.status} />}

                <DetailRow label="Pooja" value={details.pooja_name ?? "Pooja booking"} />
                <DetailRow label="Pandit" value={details.pandit_name ?? "To be assigned"} />

                <DetailItem icon={<Calendar className="h-4 w-4 text-primary" />} label="Muhurat" value={details.muhurat || "To be scheduled with your pandit"} />
                <DetailItem icon={<MapPin className="h-4 w-4 text-primary" />} label="Address" value={`${details.line1}${details.line2 ? `, ${details.line2}` : ""}, ${details.city}, ${details.state} ${details.pincode}`} />
                <DetailItem icon={<Phone className="h-4 w-4 text-primary" />} label="Contact" value={`${details.recipient_name} · ${details.phone}`} />
                <DetailItem icon={<CreditCard className="h-4 w-4 text-primary" />} label="Payment" value={`${details.payment_method.toUpperCase()} · ${details.payment_status}`} />

                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-[11px] text-muted-foreground">Booked on {bookedOn(details.created_at)}</p>
                </div>

                {tabFor(details.status) === "Upcoming" && (
                  <button
                    onClick={() => setConfirmCancel(details)}
                    className="w-full rounded-full border border-destructive/30 bg-destructive/10 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/15"
                  >
                    Cancel booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-5" onClick={() => setConfirmCancel(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-soft">
            <p className="text-base font-bold">Cancel this pooja?</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Are you sure you want to cancel <span className="font-semibold text-foreground">{confirmCancel.pooja_name ?? "this booking"}</span>?
            </p>
            <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
              Refunds follow our cancellation policy. If you paid in advance, eligible amounts return to your Pranam wallet.
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 rounded-full border border-border bg-card py-2.5 text-xs font-semibold"
              >
                Keep booking
              </button>
              <button
                onClick={() => cancel.mutate(confirmCancel.id)}
                disabled={cancel.isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-destructive py-2.5 text-xs font-semibold text-destructive-foreground disabled:opacity-60"
              >
                {cancel.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function BookingSteps({ status }: { status: string }) {
  const steps = ["Placed", "Confirmed", "Done"];
  const current = status === "completed" || status === "delivered" ? 2 : status === "confirmed" || status === "shipped" ? 1 : 0;
  return (
    <div className="flex items-center">
      {steps.map((label, i) => (
        <div key={label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {i + 1}
            </span>
            <span className={`mt-1 text-[10px] ${i <= current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
          </div>
          {i < steps.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded ${i < current ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <CalendarCheck className="h-8 w-8 text-accent" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No {tab.toLowerCase()} bookings</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {tab === "Upcoming" ? "Book a pooja and it will show up here." : `You have no ${tab.toLowerCase()} bookings yet.`}
      </p>
      <Link to="/poojas" className="mt-4 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow">
        Browse poojas
      </Link>
    </div>
  );
}
