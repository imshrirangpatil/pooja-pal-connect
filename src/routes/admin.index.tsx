import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { IndianRupee, Package, Users, Inbox, Sparkles, UserCheck } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

function Overview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [orders, users, poojas, pandits, apps] = await Promise.all([
        supabase.from("orders").select("id,total,status,created_at,recipient_name").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("poojas").select("slug", { count: "exact", head: true }),
        supabase.from("pandits").select("id", { count: "exact", head: true }),
        supabase.from("pandit_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const list = orders.data ?? [];
      const revenue = list.reduce((s, o) => s + Number(o.total ?? 0), 0);
      const pending = list.filter((o) => o.status === "placed").length;
      return {
        revenue,
        orderCount: list.length,
        pendingOrders: pending,
        userCount: users.count ?? 0,
        poojaCount: poojas.count ?? 0,
        panditCount: pandits.count ?? 0,
        pendingApps: apps.count ?? 0,
        recent: list.slice(0, 5),
      };
    },
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading metrics…</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Kpi icon={<IndianRupee className="h-4 w-4" />} label="Revenue" value={`₹${data.revenue.toLocaleString("en-IN")}`} accent />
        <Kpi icon={<Package className="h-4 w-4" />} label="Orders" value={String(data.orderCount)} hint={`${data.pendingOrders} pending`} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Users" value={String(data.userCount)} />
        <Kpi icon={<Inbox className="h-4 w-4" />} label="Pandit applications" value={String(data.pendingApps)} hint="pending review" />
        <Kpi icon={<Sparkles className="h-4 w-4" />} label="Poojas" value={String(data.poojaCount)} />
        <Kpi icon={<UserCheck className="h-4 w-4" />} label="Pandits" value={String(data.panditCount)} />
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-bold">Recent orders</h2>
        {data.recent.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {data.recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{o.recipient_name}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{Number(o.total).toLocaleString("en-IN")}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{o.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, hint, accent }: { icon: React.ReactNode; label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <Card className={`p-3 ${accent ? "bg-primary text-primary-foreground" : ""}`}>
      <div className="flex items-center gap-2 text-xs opacity-90">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {hint && <p className="text-[10px] opacity-75">{hint}</p>}
    </Card>
  );
}
