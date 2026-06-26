import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/applications")({ component: AdminApplications });

const STATUSES = ["pending", "approved", "rejected"] as const;

function AdminApplications() {
  const qc = useQueryClient();
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pandit_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("pandit_applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application updated");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold">Pandit applications ({apps.length})</h2>
      {apps.length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}
      {apps.map((a) => (
        <Card key={a.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold">{a.full_name}</p>
              <p className="text-[11px] text-muted-foreground">{a.phone} · {a.city || " - "} · {a.experience} yrs</p>
              <p className="mt-1 text-xs"><span className="text-muted-foreground">Specialties:</span> {a.specialties || " - "}</p>
              <p className="text-xs"><span className="text-muted-foreground">Languages:</span> {a.languages || " - "}</p>
              {a.message && <p className="mt-1 text-xs italic text-muted-foreground">"{a.message}"</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString("en-IN")}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] uppercase ${
              a.status === "approved" ? "bg-green-100 text-green-700" :
              a.status === "rejected" ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            }`}>{a.status}</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {STATUSES.map((s) => (
              <Button key={s} size="sm" variant={a.status === s ? "default" : "secondary"}
                disabled={update.isPending || a.status === s}
                onClick={() => update.mutate({ id: a.id, status: s })}>
                {s}
              </Button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
