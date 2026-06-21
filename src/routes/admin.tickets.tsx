import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, MessageSquare, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/tickets")({ component: AdminTickets });

type Status = "open" | "in_progress" | "resolved";
type Ticket = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string;
  subject: string;
  message: string;
  source: "form" | "chat";
  status: Status;
  transcript: { role: "user" | "assistant"; content: string }[] | null;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

const STATUSES: Status[] = ["open", "in_progress", "resolved"];
const STATUS_STYLE: Record<Status, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
};

function AdminTickets() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async (): Promise<Ticket[]> => {
      const { data, error } = await (supabase as any)
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Ticket> }) => {
      const { error } = await (supabase as any)
        .from("support_tickets")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast.success("Ticket updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("support_tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast.success("Ticket deleted");
    },
  });

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
              filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            {s.replace("_", " ")} · {counts[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tickets…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No tickets here.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              expanded={expanded === t.id}
              onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
              onUpdate={(patch) => update.mutate({ id: t.id, patch })}
              onDelete={() => {
                if (confirm("Delete this ticket?")) remove.mutate(t.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  ticket: Ticket;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Ticket>) => void;
  onDelete: () => void;
}) {
  const [response, setResponse] = useState(ticket.admin_response ?? "");

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", STATUS_STYLE[ticket.status])}>
              {ticket.status.replace("_", " ")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase">
              {ticket.source === "chat" ? <MessageSquare className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
              {ticket.source}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(ticket.created_at).toLocaleString("en-IN")}
            </span>
          </div>
          <h3 className="mt-1.5 truncate text-sm font-bold">{ticket.subject}</h3>
          <p className="text-[11px] text-muted-foreground">
            {ticket.name ? `${ticket.name} · ` : ""}{ticket.email}
          </p>
        </div>
        <button onClick={onToggle} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Message</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{ticket.message}</p>
          </div>

          {ticket.transcript && ticket.transcript.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Chat transcript</p>
              <div className="mt-1.5 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-border/60 bg-background p-2">
                {ticket.transcript.map((m, i) => (
                  <div key={i} className={cn("text-xs", m.role === "user" ? "text-foreground" : "text-muted-foreground")}>
                    <span className="font-bold capitalize">{m.role}: </span>
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Admin response (internal)</p>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Notes / response to send the user…"
              rows={3}
              className="mt-1.5"
            />
            <Button
              size="sm"
              className="mt-2"
              onClick={() => onUpdate({ admin_response: response })}
            >
              Save response
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status:</span>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => onUpdate({ status: s })}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                  ticket.status === s ? STATUS_STYLE[s] : "bg-secondary text-muted-foreground"
                )}
              >
                {s.replace("_", " ")}
              </button>
            ))}
            <button
              onClick={onDelete}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
