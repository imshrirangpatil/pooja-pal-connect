import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/lib/auth";
import { useMyPandit } from "@/lib/my-pandit";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IndianRupee, Wallet, Clock, CheckCircle2, XCircle, Loader2, BadgeIndianRupee } from "lucide-react";

export const Route = createFileRoute("/earnings")({
  head: () => ({ meta: [{ title: "My Earnings — Pranam" }] }),
  component: EarningsPage,
});

const COMMISSION = 0.15; // platform fee; pandit keeps the rest.
const EARNED_STATUSES = ["completed", "delivered"];
const OPEN_PAYOUT = ["requested", "pending", "processing", "paid"];

type Payout = {
  id: string;
  amount_paise: number;
  method: string;
  status: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

function EarningsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { pandit, loading: panditLoading } = useMyPandit();
  const { t } = useI18n();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/signup" });
  }, [authLoading, user, navigate]);

  const ordersQ = useQuery({
    queryKey: ["pandit-earned-orders", pandit?.id],
    enabled: !!pandit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("total, status")
        .eq("pandit_id", pandit!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const payoutsQ = useQuery({
    queryKey: ["pandit-own-payouts", pandit?.id],
    enabled: !!pandit,
    queryFn: async (): Promise<Payout[]> => {
      const { data, error } = await (supabase as any)
        .from("pandit_payouts")
        .select("id, amount_paise, method, status, reference, notes, created_at")
        .eq("pandit_id", pandit!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Payout[];
    },
  });

  const bookingsQ = useQuery({
    queryKey: ["pandit-bookings", pandit?.id],
    enabled: !!pandit,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("id, pooja_name, recipient_name, muhurat, total, status, created_at")
        .eq("pandit_id", pandit!.id)
        .not("pooja_slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; pooja_name: string | null; recipient_name: string; muhurat: string | null; total: number; status: string; created_at: string }>;
    },
  });

  // Order totals are stored in rupees; convert to paise to match payout amounts.
  const earnedPaise = (ordersQ.data ?? [])
    .filter((o: any) => EARNED_STATUSES.includes(o.status))
    .reduce((s: number, o: any) => s + Math.round((o.total || 0) * (1 - COMMISSION) * 100), 0);
  const drawnPaise = (payoutsQ.data ?? [])
    .filter((p) => OPEN_PAYOUT.includes(p.status))
    .reduce((s, p) => s + (p.amount_paise || 0), 0);
  const availablePaise = Math.max(0, earnedPaise - drawnPaise);

  const request = useMutation({
    mutationFn: async () => {
      if (availablePaise <= 0) throw new Error(t("earn.nothingToWithdraw"));
      const { error } = await (supabase as any).from("pandit_payouts").insert({
        pandit_id: pandit!.id,
        amount_paise: availablePaise,
        method: "upi",
        status: "requested",
        notes: "Payout requested by pandit",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("earn.payoutRequested"));
      qc.invalidateQueries({ queryKey: ["pandit-own-payouts", pandit?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <MobileShell>
      <TopBar title={t("earn.title")} right={<BackButton fallback="/profile" className="h-10 w-10 border border-border bg-card" />} />

      <div className="px-5 pt-4 pb-10">
        {authLoading || panditLoading ? (
          <div className="h-28 animate-pulse rounded-2xl bg-secondary/60" />
        ) : !pandit ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-soft">
            <BadgeIndianRupee className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">{t("earn.noProfile")}</p>
            <p className="text-xs text-muted-foreground">
              {t("earn.noProfileSub")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-3xl bg-secondary p-5 text-secondary-foreground shadow-glow">
              <p className="text-xs opacity-90">{t("earn.available")}</p>
              <p className="mt-1 inline-flex items-center text-3xl font-bold">
                <IndianRupee className="h-6 w-6" />
                {(availablePaise / 100).toLocaleString("en-IN")}
              </p>
              <div className="mt-3 flex gap-3 text-xs">
                <span className="rounded-full bg-background/20 px-2.5 py-1">{t("earn.earned")} ₹{(earnedPaise / 100).toLocaleString("en-IN")}</span>
                <span className="rounded-full bg-background/20 px-2.5 py-1">{t("earn.drawn")} ₹{(drawnPaise / 100).toLocaleString("en-IN")}</span>
              </div>
              <button
                onClick={() => request.mutate()}
                disabled={request.isPending || availablePaise <= 0}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
              >
                <Wallet className="h-4 w-4" /> {request.isPending ? t("earn.requesting") : t("earn.requestPayout")}
              </button>
              <p className="mt-2 text-[11px] opacity-80">{t("earn.feeNote")}</p>
            </div>

            <h3 className="px-1 pt-2 text-sm font-bold">{t("earn.assignedBookings")}</h3>
            {bookingsQ.isLoading ? (
              <div className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
            ) : (bookingsQ.data ?? []).length === 0 ? (
              <p className="px-1 text-xs text-muted-foreground">{t("earn.noBookings")}</p>
            ) : (
              <div className="space-y-2">
                {(bookingsQ.data ?? []).map((b) => (
                  <div key={b.id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{b.pooja_name ?? "Pooja booking"}</p>
                        <p className="text-[11px] text-muted-foreground">{b.recipient_name} · {b.muhurat || new Date(b.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="inline-flex items-center text-sm font-bold"><IndianRupee className="h-3.5 w-3.5" />{(b.total ?? 0).toLocaleString("en-IN")}</p>
                        <p className="text-[10px] capitalize text-muted-foreground">{b.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="px-1 pt-2 text-sm font-bold">{t("earn.payoutHistory")}</h3>
            {payoutsQ.isLoading ? (
              <div className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
            ) : (payoutsQ.data ?? []).length === 0 ? (
              <p className="px-1 text-xs text-muted-foreground">{t("earn.noPayouts")}</p>
            ) : (
              <div className="space-y-2">
                {(payoutsQ.data ?? []).map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
                    <div>
                      <p className="inline-flex items-center text-sm font-bold">
                        <IndianRupee className="h-3.5 w-3.5" />{(p.amount_paise / 100).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()} · {p.method.toUpperCase()}
                        {p.reference ? ` · ref ${p.reference}` : ""}
                      </p>
                    </div>
                    <PayoutBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function PayoutBadge({ status }: { status: string }) {
  const paid = status === "paid";
  const failed = status === "failed" || status === "rejected";
  const cls = paid ? "bg-green-100 text-green-700" : failed ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
  const Icon = paid ? CheckCircle2 : failed ? XCircle : status === "processing" ? Loader2 : Clock;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}
