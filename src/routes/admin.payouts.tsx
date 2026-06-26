import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle, Loader2, IndianRupee, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/payouts")({ component: AdminPayouts });

type PayoutStatus = "requested" | "pending" | "processing" | "paid" | "failed" | "rejected";

type PayoutRow = {
  id: string;
  pandit_id: string;
  amount_paise: number;
  method: string;
  status: PayoutStatus;
  reference: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  pandits: { name: string } | null;
};

const FILTERS: { key: "open" | PayoutStatus | "all"; label: string }[] = [
  { key: "open", label: "Needs action" },
  { key: "requested", label: "Requested" },
  { key: "processing", label: "Processing" },
  { key: "paid", label: "Paid" },
  { key: "all", label: "All" },
];

const OPEN_STATUSES: PayoutStatus[] = ["requested", "pending", "processing"];

function AdminPayouts() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"open" | PayoutStatus | "all">("open");

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async (): Promise<PayoutRow[]> => {
      const { data, error } = await (supabase as any)
        .from("pandit_payouts")
        .select("id, pandit_id, amount_paise, method, status, reference, notes, created_at, paid_at, pandits(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayoutRow[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PayoutStatus }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "paid") patch.paid_at = new Date().toISOString();
      const { error } = await (supabase as any).from("pandit_payouts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast.success("Payout updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = payouts.filter((p) =>
    filter === "all" ? true : filter === "open" ? OPEN_STATUSES.includes(p.status) : p.status === filter,
  );

  const outstanding = payouts
    .filter((p) => OPEN_STATUSES.includes(p.status))
    .reduce((s, p) => s + (p.amount_paise || 0), 0);
  const paidTotal = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount_paise || 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 text-center">
          <p className="text-base font-bold">₹{(outstanding / 100).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-muted-foreground">Outstanding to pay</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-base font-bold">₹{(paidTotal / 100).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-muted-foreground">Paid out</p>
        </Card>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading payouts…</p>
      ) : visible.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No payouts in this view.</Card>
      ) : (
        <div className="space-y-2">
          {visible.map((p) => (
            <Card key={p.id} className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    to="/admin/pandits/$id"
                    params={{ id: p.pandit_id }}
                    className="inline-flex items-center gap-1 text-sm font-bold hover:underline"
                  >
                    {p.pandits?.name ?? "Pandit"} <ChevronRight className="h-3 w-3" />
                  </Link>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()} · {p.method.toUpperCase()}
                    {p.reference ? ` · ref ${p.reference}` : ""}
                  </p>
                  {p.notes && <p className="mt-0.5 text-[11px] text-muted-foreground">{p.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="inline-flex items-center font-bold">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {(p.amount_paise / 100).toLocaleString("en-IN")}
                  </p>
                  <StatusBadge status={p.status} />
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {(p.status === "requested" || p.status === "pending") && (
                  <>
                    <Button size="sm" className="h-8 gap-1.5" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "processing" })}>
                      <Loader2 className="h-3.5 w-3.5" /> Mark processing
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "rejected" })}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {p.status === "processing" && (
                  <>
                    <Button size="sm" className="h-8 gap-1.5" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "paid" })}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: p.id, status: "failed" })}>
                      <XCircle className="h-3.5 w-3.5" /> Mark failed
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="px-1 text-[11px] text-muted-foreground">
        To record a direct payment to a specific pandit, open their profile from the Pandits tab.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  const map: Record<PayoutStatus, { cls: string; icon: React.ReactNode }> = {
    requested: { cls: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
    pending: { cls: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
    processing: { cls: "bg-blue-100 text-blue-700", icon: <Loader2 className="h-3 w-3" /> },
    paid: { cls: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { cls: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> },
    rejected: { cls: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status];
  return (
    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
      {s.icon} {status}
    </span>
  );
}
