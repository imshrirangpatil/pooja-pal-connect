import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/astrologers")({ component: AdminAstrologers });

const CATEGORIES = ["Vedic", "Tarot", "Numerology", "Vastu", "Palmistry", "Nadi"];

type Form = {
  name: string;
  expertise: string;
  category: string;
  experience: number;
  rating: number;
  price_per_min: number;
  languages: string;
  initials: string;
  online: boolean;
  visible: boolean;
};
const empty: Form = {
  name: "", expertise: "", category: "Vedic", experience: 0, rating: 4.5,
  price_per_min: 0, languages: "", initials: "", online: true, visible: true,
};

function toPayload(f: Form) {
  return {
    name: f.name,
    expertise: f.expertise,
    category: f.category,
    experience: f.experience,
    rating: f.rating,
    price_per_min: f.price_per_min,
    languages: f.languages.split(",").map((s) => s.trim()).filter(Boolean),
    initials: f.initials || f.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
    online: f.online,
    visible: f.visible,
  };
}

function AdminAstrologers() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Form>(empty);

  const { data: astrologers = [], isLoading } = useQuery({
    queryKey: ["admin-astrologers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("astrologers").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, f }: { id?: string; f: Form }) => {
      if (id) {
        const { error } = await (supabase as any).from("astrologers").update(toPayload(f)).eq("id", id);
        if (error) throw error;
      } else {
        const ref = "a-" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
        const { error } = await (supabase as any).from("astrologers").insert({ ...toPayload(f), ref });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-astrologers"] });
      setAdding(false);
      setDraft(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("astrologers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-astrologers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Astrologers ({astrologers.length})</h2>
        <Button size="sm" onClick={() => setAdding((a) => !a)}><Plus className="h-3.5 w-3.5" /> {adding ? "Cancel" : "Add"}</Button>
      </div>

      {adding && (
        <Card className="space-y-2 p-4">
          <Fields f={draft} set={setDraft} />
          <Button onClick={() => save.mutate({ f: draft })} disabled={save.isPending || !draft.name}>Create</Button>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {astrologers.map((a) => (
        <AstrologerRow key={a.id} astro={a} onSave={(f) => save.mutate({ id: a.id, f })} onDelete={() => del.mutate(a.id)} />
      ))}
    </div>
  );
}

function Fields({ f, set }: { f: Form; set: (f: Form) => void }) {
  return (
    <>
      <Input placeholder="Name" value={f.name} onChange={(e) => set({ ...f, name: e.target.value })} />
      <Input placeholder="Expertise (e.g. Vedic & Kundli)" value={f.expertise} onChange={(e) => set({ ...f, expertise: e.target.value })} />
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={f.category}
        onChange={(e) => set({ ...f, category: e.target.value })}
      >
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <Input type="number" placeholder="Experience (years)" value={f.experience || ""} onChange={(e) => set({ ...f, experience: Number(e.target.value) })} />
      <Input type="number" step="0.1" placeholder="Rating" value={f.rating} onChange={(e) => set({ ...f, rating: Number(e.target.value) })} />
      <Input type="number" placeholder="Price per min (₹)" value={f.price_per_min || ""} onChange={(e) => set({ ...f, price_per_min: Number(e.target.value) })} />
      <Input placeholder="Languages (comma-separated)" value={f.languages} onChange={(e) => set({ ...f, languages: e.target.value })} />
      <Input placeholder="Initials (optional)" value={f.initials} onChange={(e) => set({ ...f, initials: e.target.value })} />
      <div className="flex gap-3 text-xs">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={f.online} onChange={(e) => set({ ...f, online: e.target.checked })} /> Online</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={f.visible} onChange={(e) => set({ ...f, visible: e.target.checked })} /> Visible</label>
      </div>
    </>
  );
}

function AstrologerRow({ astro, onSave, onDelete }: { astro: any; onSave: (f: Form) => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const langs = Array.isArray(astro.languages) ? (astro.languages as string[]) : [];
  const [form, setForm] = useState<Form>({
    name: astro.name, expertise: astro.expertise ?? "", category: astro.category ?? "Vedic",
    experience: astro.experience ?? 0, rating: Number(astro.rating ?? 0), price_per_min: astro.price_per_min ?? 0,
    languages: langs.join(", "), initials: astro.initials ?? "", online: !!astro.online, visible: !!astro.visible,
  });

  return (
    <Card className="p-4">
      {!edit ? (
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{astro.name} {astro.online ? "🟢" : "⚪"}</p>
            <p className="text-[11px] text-muted-foreground">{astro.expertise} · {astro.category} · {astro.experience} yrs · ⭐ {Number(astro.rating)}</p>
            <p className="text-[11px]">₹{astro.price_per_min}/min · {langs.join(", ")}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${astro.visible ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {astro.visible ? "Visible" : "Hidden"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="secondary" onClick={() => setEdit(true)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Fields f={form} set={setForm} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onSave(form); setEdit(false); }}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
