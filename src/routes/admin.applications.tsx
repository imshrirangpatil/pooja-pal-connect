import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { INTERVIEW_BOOKING_URL } from "@/lib/partner";
import { FileText, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/admin/applications")({ component: AdminApplications });

const STATUSES = ["pending", "approved", "rejected"] as const;

function AdminApplications() {
  const qc = useQueryClient();
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from("pandit_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ app, status }: { app: any; status: string }) => {
      // Approving an application publishes the pandit so they appear on the pandits page.
      if (status === "approved") {
        const splitList = (s: string | null) =>
          (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
        const initials = (app.full_name as string)
          .split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
        const ref = `app-${String(app.id).slice(0, 8)}`;

        // Only create the pandit once (re-approval is blocked by the disabled button anyway).
        const { data: existing } = await (supabase as any)
          .from("pandits").select("id").eq("ref", ref).maybeSingle();
        if (!existing) {
          const { error: insErr } = await (supabase.from("pandits") as any).insert({
            ref,
            name: app.full_name,
            city: app.city,
            experience: app.experience ?? 0,
            rating: 5,
            reviews: 0,
            languages: splitList(app.languages),
            specialties: splitList(app.specialties),
            initials,
            verified: true,
            visible: true,
            bio: app.message ?? null,
            fee_from: 1100,
            pooja_slugs: [],
            user_id: app.user_id ?? null,
          });
          if (insErr) throw insErr;
        }
      }
      const { error } = await supabase.from("pandit_applications").update({ status }).eq("id", app.id);
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
          {(a.aadhaar_url || a.credential_url || a.selfie_url) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { path: a.aadhaar_url, label: "ID" },
                { path: a.credential_url, label: "Credential" },
                { path: a.selfie_url, label: "Selfie" },
              ].filter((d) => d.path).map((d) => (
                <DocLink key={d.label} path={d.path as string} label={d.label} />
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {STATUSES.map((s) => (
              <Button key={s} size="sm" variant={a.status === s ? "default" : "secondary"}
                disabled={update.isPending || a.status === s}
                onClick={() => update.mutate({ app: a, status: s })}>
                {s}
              </Button>
            ))}
            <a href={INTERVIEW_BOOKING_URL} target="_blank" rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-primary/40 px-2.5 py-1.5 text-[11px] font-semibold text-primary">
              <CalendarClock className="h-3 w-3" /> Book interview
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}

// KYC docs live in a private bucket, so we mint a short-lived signed URL on click.
function DocLink({ path, label }: { path: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.storage.from("pandit-docs").createSignedUrl(path, 120);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open document");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={open} disabled={busy}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground disabled:opacity-60">
      <FileText className="h-3 w-3" /> {busy ? "Opening…" : label}
    </button>
  );
}
