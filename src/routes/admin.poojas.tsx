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

export const Route = createFileRoute("/admin/poojas")({ component: AdminPoojas });

type PoojaForm = {
  slug: string;
  name: string;
  tagline: string;
  duration: string;
  price_from: number;
  description: string;
  season: string;
  popular: boolean;
  visible: boolean;
};

const empty: PoojaForm = {
  slug: "", name: "", tagline: "", duration: "", price_from: 0,
  description: "", season: "", popular: false, visible: true,
};

function AdminPoojas() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<PoojaForm>(empty);

  const { data: poojas = [], isLoading } = useQuery({
    queryKey: ["admin-poojas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("poojas").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (p: PoojaForm) => {
      const { error } = await supabase.from("poojas").upsert({
        slug: p.slug, name: p.name, tagline: p.tagline, duration: p.duration,
        price_from: p.price_from, description: p.description, season: p.season || null,
        popular: p.popular, visible: p.visible,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-poojas"] });
      setAdding(false);
      setDraft(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.from("poojas").delete().eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-poojas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Poojas ({poojas.length})</h2>
        <Button size="sm" onClick={() => setAdding((a) => !a)}>
          <Plus className="h-3.5 w-3.5" /> {adding ? "Cancel" : "Add"}
        </Button>
      </div>

      {adding && (
        <Card className="space-y-2 p-4">
          <Input placeholder="slug (unique, e.g. ganesh-pooja)" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
          <Input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input placeholder="Tagline" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
          <Input placeholder="Duration (e.g. 1.5 hrs)" value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} />
          <Input type="number" placeholder="Price from" value={draft.price_from || ""} onChange={(e) => setDraft({ ...draft, price_from: Number(e.target.value) })} />
          <Input placeholder="Season (optional)" value={draft.season} onChange={(e) => setDraft({ ...draft, season: e.target.value })} />
          <Textarea placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <Button onClick={() => save.mutate(draft)} disabled={save.isPending || !draft.slug || !draft.name}>
            <Save className="h-3.5 w-3.5" /> Create
          </Button>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {poojas.map((p) => (
        <PoojaRow key={p.slug} pooja={p} onSave={(d) => save.mutate(d)} onDelete={() => del.mutate(p.slug)} />
      ))}
    </div>
  );
}

function PoojaRow({ pooja, onSave, onDelete }: {
  pooja: PoojaForm & { slug: string };
  onSave: (p: PoojaForm) => void;
  onDelete: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<PoojaForm>(pooja);

  return (
    <Card className="p-4">
      {!edit ? (
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{pooja.name}</p>
              <p className="text-[11px] text-muted-foreground">{pooja.tagline}</p>
              <p className="mt-1 text-xs">₹{pooja.price_from} · {pooja.duration} {pooja.season && `· ${pooja.season}`}</p>
              <div className="mt-1 flex gap-1.5 text-[10px]">
                {pooja.popular && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">Popular</span>}
                <span className={`rounded-full px-2 py-0.5 ${pooja.visible ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {pooja.visible ? "Visible" : "Hidden"}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="secondary" onClick={() => setEdit(true)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <Input type="number" value={form.price_from} onChange={(e) => setForm({ ...form, price_from: Number(e.target.value) })} />
          <Input value={form.season ?? ""} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="Season" />
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Popular</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} /> Visible</label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(form); setEdit(false); }}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setForm(pooja); setEdit(false); }}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
