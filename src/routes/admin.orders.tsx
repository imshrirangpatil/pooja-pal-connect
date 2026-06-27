import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = ["placed", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading orders…</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold">All orders ({orders.length})</h2>
      {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
      {orders.map((o) => (
        <Card key={o.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{o.recipient_name}</p>
              <p className="text-[11px] text-muted-foreground">{o.phone} · {o.city}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">₹{Number(o.total).toLocaleString("en-IN")}</p>
              <p className="text-[10px] uppercase text-muted-foreground">{o.payment_method}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => update.mutate({ id: o.id, status: s })}
                disabled={update.isPending || o.status === s}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  o.status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
