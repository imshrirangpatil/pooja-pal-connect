import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["app_role"];
const ROLES: Role[] = ["user", "pandit", "admin"];

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      const rolesByUser = new Map<string, Role[]>();
      for (const r of rolesRes.data) {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      }
      return profilesRes.data.map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: Role; has: boolean }) => {
      if (has) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading users…</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold">Users ({data.length})</h2>
      {data.map((u) => (
        <Card key={u.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{u.full_name || "Unnamed"}</p>
              <p className="text-[11px] text-muted-foreground">{u.phone || "—"}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{u.id}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ROLES.map((r) => {
              const has = u.roles.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => toggleRole.mutate({ userId: u.id, role: r, has })}
                  disabled={toggleRole.isPending}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    has ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {has ? `✓ ${r}` : r}
                </button>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
