import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/admin/pandits")({ component: AdminPandits });

type Form = {
  name: string;
  city: string;
  experience: number;
  rating: number;
  reviews: number;
  languages: string;
  specialties: string;
  initials: string;
  verified: boolean;
  visible: boolean;
};
const empty: Form = { name: "", city: "", experience: 0, rating: 4.5, reviews: 0, languages: "", specialties: "", initials: "", verified: true, visible: true };

function AdminPandits() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Form>(empty);

  const { data: pandits = [], isLoading } = useQuery({
    queryKey: ["admin-pandits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pandits").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, f }: { id?: string; f: Form }) => {
      const payload = {
        name: f.name, city: f.city, experience: f.experience, rating: f.rating, reviews: f.reviews,
        languages: f.languages.split(",").map((s) => s.trim()).filter(Boolean),
        specialties: f.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        initials: f.initials || f.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
        verified: f.verified, visible: f.visible,
      };
      if (id) {
        const { error } = await supabase.from("pandits").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pandits").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-pandits"] });
      setAdding(false); setDraft(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pandits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-pandits"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Pandits ({pandits.length})</h2>
        <Button size="sm" onClick={() => setAdding((a) => !a)}><Plus className="h-3.5 w-3.5" /> {adding ? "Cancel" : "Add"}</Button>
      </div>

      {adding && (
        <Card className="space-y-2 p-4">
          <Input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
          <Input type="number" placeholder="Experience (years)" value={draft.experience || ""} onChange={(e) => setDraft({ ...draft, experience: Number(e.target.value) })} />
          <Input type="number" step="0.1" placeholder="Rating" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })} />
          <Input type="number" placeholder="Reviews" value={draft.reviews} onChange={(e) => setDraft({ ...draft, reviews: Number(e.target.value) })} />
          <Input placeholder="Languages (comma-separated)" value={draft.languages} onChange={(e) => setDraft({ ...draft, languages: e.target.value })} />
          <Input placeholder="Specialties (comma-separated)" value={draft.specialties} onChange={(e) => setDraft({ ...draft, specialties: e.target.value })} />
          <Button onClick={() => save.mutate({ f: draft })} disabled={save.isPending || !draft.name}>Create</Button>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {pandits.map((p) => (
        <PanditRow key={p.id} pandit={p} onSave={(f) => save.mutate({ id: p.id, f })} onDelete={() => del.mutate(p.id)} />
      ))}
    </div>
  );
}

function PanditRow({ pandit, onSave, onDelete }: {
  pandit: { id: string; name: string; city: string; experience: number; rating: number; reviews: number; languages: unknown; specialties: unknown; initials: string; verified: boolean; visible: boolean };
  onSave: (f: Form) => void;
  onDelete: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const langs = Array.isArray(pandit.languages) ? (pandit.languages as string[]) : [];
  const specs = Array.isArray(pandit.specialties) ? (pandit.specialties as string[]) : [];
  const [form, setForm] = useState<Form>({
    name: pandit.name, city: pandit.city, experience: pandit.experience,
    rating: Number(pandit.rating), reviews: pandit.reviews,
    languages: langs.join(", "), specialties: specs.join(", "),
    initials: pandit.initials, verified: pandit.verified, visible: pandit.visible,
  });

  return (
    <Card className="p-4">
      {!edit ? (
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{pandit.name} {pandit.verified && "✓"}</p>
            <p className="text-[11px] text-muted-foreground">{pandit.city} · {pandit.experience} yrs · ⭐ {Number(pandit.rating)} ({pandit.reviews})</p>
            <p className="mt-1 text-[11px]">{specs.join(", ")}</p>
            <p className="text-[10px] text-muted-foreground">{langs.join(", ")}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${pandit.visible ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {pandit.visible ? "Visible" : "Hidden"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="secondary" onClick={() => setEdit(true)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} />
          <Input type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
          <Input type="number" value={form.reviews} onChange={(e) => setForm({ ...form, reviews: Number(e.target.value) })} />
          <Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="Languages" />
          <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Specialties" />
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} /> Verified</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} /> Visible</label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(form); setEdit(false); }}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
