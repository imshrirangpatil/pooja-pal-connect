import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/festivals")({ component: AdminFestivals });

type FestivalType = "major" | "vrat" | "ekadashi" | "amavasya" | "purnima";
type FestivalRow = {
  id?: string;
  name: string;
  festival_date: string; // YYYY-MM-DD
  type: FestivalType;
  note: string;
  pooja_slug: string;
  pooja_label: string;
  visible: boolean;
};

const empty: FestivalRow = {
  name: "", festival_date: "", type: "major", note: "",
  pooja_slug: "", pooja_label: "", visible: true,
};

const TYPES: FestivalType[] = ["major", "vrat", "ekadashi", "amavasya", "purnima"];

function AdminFestivals() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<FestivalRow>(empty);

  const handleCreate = () => {
    const cleanedDraft = {
      ...draft,
      name: draft.name.trim(),
      note: draft.note.trim(),
      pooja_slug: draft.pooja_slug.trim(),
      pooja_label: draft.pooja_label.trim(),
    };

    if (!cleanedDraft.name) {
      toast.error("Please enter the festival name");
      return;
    }

    if (!cleanedDraft.festival_date) {
      toast.error("Please select the festival date");
      return;
    }

    save.mutate(cleanedDraft);
  };

  const { data: festivals = [], isLoading } = useQuery({
    queryKey: ["admin-festivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("festivals")
        .select("*")
        .order("festival_date");
      if (error) throw error;
      return data as any[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: FestivalRow) => {
      const payload = {
        ...(p.id ? { id: p.id } : {}),
        name: p.name,
        festival_date: p.festival_date,
        type: p.type,
        note: p.note,
        pooja_slug: p.pooja_slug || null,
        pooja_label: p.pooja_label || null,
        visible: p.visible,
      };
      const { error } = await supabase.from("festivals").upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-festivals"] });
      qc.invalidateQueries({ queryKey: ["festivals"] });
      setAdding(false);
      setDraft(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("festivals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-festivals"] });
      qc.invalidateQueries({ queryKey: ["festivals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Festivals ({festivals.length})</h2>
        <Button size="sm" onClick={() => setAdding((a) => !a)}>
          <Plus className="h-3.5 w-3.5" /> {adding ? "Cancel" : "Add"}
        </Button>
      </div>

      {adding && (
        <Card className="space-y-2 p-4">
          <Input placeholder="Festival name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input type="date" value={draft.festival_date} onChange={(e) => setDraft({ ...draft, festival_date: e.target.value })} />
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as FestivalType })}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Textarea placeholder="Note" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          <Input placeholder="Pooja slug (optional, e.g. lakshmi-pooja)" value={draft.pooja_slug} onChange={(e) => setDraft({ ...draft, pooja_slug: e.target.value })} />
          <Input placeholder="Pooja label (optional, e.g. Lakshmi Pooja)" value={draft.pooja_label} onChange={(e) => setDraft({ ...draft, pooja_label: e.target.value })} />
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={draft.visible} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} /> Visible
          </label>
          <Button onClick={handleCreate} disabled={save.isPending}>
            <Save className="h-3.5 w-3.5" /> {save.isPending ? "Creating…" : "Create"}
          </Button>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {festivals.map((f) => (
        <FestivalRowEdit
          key={f.id}
          row={{
            id: f.id, name: f.name, festival_date: f.festival_date, type: f.type,
            note: f.note ?? "", pooja_slug: f.pooja_slug ?? "", pooja_label: f.pooja_label ?? "",
            visible: f.visible,
          }}
          onSave={(d) => save.mutate(d)}
          onDelete={() => del.mutate(f.id)}
        />
      ))}
    </div>
  );
}

function FestivalRowEdit({ row, onSave, onDelete }: {
  row: FestivalRow & { id: string };
  onSave: (r: FestivalRow) => void;
  onDelete: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<FestivalRow>(row);

  return (
    <Card className="p-4">
      {!edit ? (
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{row.name}</p>
            <p className="text-[11px] text-muted-foreground">{row.festival_date} · {row.type}</p>
            <p className="mt-1 text-xs">{row.note}</p>
            {row.pooja_slug && <p className="mt-1 text-[11px] text-primary">→ {row.pooja_label || row.pooja_slug}</p>}
            <div className="mt-1">
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.visible ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {row.visible ? "Visible" : "Hidden"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="secondary" onClick={() => setEdit(true)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input type="date" value={form.festival_date} onChange={(e) => setForm({ ...form, festival_date: e.target.value })} />
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as FestivalType })}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Input placeholder="Pooja slug" value={form.pooja_slug} onChange={(e) => setForm({ ...form, pooja_slug: e.target.value })} />
          <Input placeholder="Pooja label" value={form.pooja_label} onChange={(e) => setForm({ ...form, pooja_label: e.target.value })} />
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} /> Visible
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(form); setEdit(false); }}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setForm(row); setEdit(false); }}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
