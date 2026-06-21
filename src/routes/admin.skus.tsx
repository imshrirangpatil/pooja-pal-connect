import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Save, Package } from "lucide-react";

export const Route = createFileRoute("/admin/skus")({ component: AdminSkus });

type SkuCategory = "kit" | "samagri" | "blessed";

type SkuForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: SkuCategory;
  price: number;
  mrp: number;
  image_url: string;
  stock: number;
  active: boolean;
  sort_order: number;
  tags: string;
};

const empty: SkuForm = {
  name: "", slug: "", description: "", category: "samagri",
  price: 0, mrp: 0, image_url: "", stock: 0, active: true, sort_order: 0, tags: "",
};

const CATEGORY_LABEL: Record<SkuCategory, string> = {
  kit: "Pooja Kit",
  samagri: "Individual Samagri",
  blessed: "Blessed Items",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminSkus() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SkuForm | null>(null);

  const { data: skus = [], isLoading } = useQuery({
    queryKey: ["admin-skus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_skus").select("*")
        .order("category").order("sort_order").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (p: SkuForm) => {
      const payload = {
        ...(p.id ? { id: p.id } : {}),
        name: p.name,
        slug: p.slug || slugify(p.name),
        description: p.description || null,
        category: p.category,
        price_paise: Math.round(p.price * 100),
        mrp_paise: Math.round((p.mrp || p.price) * 100),
        image_url: p.image_url || null,
        stock: p.stock,
        active: p.active,
        sort_order: p.sort_order,
        tags: p.tags ? p.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      const { error } = await supabase.from("store_skus").upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-skus"] });
      qc.invalidateQueries({ queryKey: ["store-skus"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_skus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-skus"] });
      qc.invalidateQueries({ queryKey: ["store-skus"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = (["kit", "samagri", "blessed"] as SkuCategory[]).map((cat) => ({
    cat, items: skus.filter((s: any) => s.category === cat),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Store SKUs</h2>
          <p className="text-xs text-muted-foreground">Manage kits, individual samagri & blessed items</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...empty })}>
          <Plus className="mr-1 h-4 w-4" /> New SKU
        </Button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h3 className="mb-3 text-sm font-semibold">{editing.id ? "Edit SKU" : "New SKU"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium">Name</label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium">Slug</label>
              <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Category</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as SkuCategory })}
              >
                <option value="kit">Pooja Kit</option>
                <option value="samagri">Individual Samagri</option>
                <option value="blessed">Blessed Item (rudraksh, gemstone…)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Description</label>
              <Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Price (₹)</label>
              <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium">MRP (₹)</label>
              <Input type="number" value={editing.mrp} onChange={(e) => setEditing({ ...editing, mrp: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Image URL</label>
              <Input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="text-xs font-medium">Stock</label>
              <Input type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium">Sort order</label>
              <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Tags (comma-separated)</label>
              <Input value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} placeholder="rudraksh, 5-mukhi" />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Active (visible in store)
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" disabled={!editing.name || !editing.price || save.isPending} onClick={() => save.mutate(editing)}>
              <Save className="mr-1 h-4 w-4" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : skus.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
          No SKUs yet. Click "New SKU" to add your first product.
        </div>
      ) : (
        grouped.map(({ cat, items }) =>
          items.length === 0 ? null : (
            <section key={cat}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[cat]} ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {s.image_url && <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{s.name}</p>
                        {!s.active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Hidden</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ₹{(s.price_paise / 100).toFixed(0)} · stock {s.stock}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setEditing({
                      id: s.id, name: s.name, slug: s.slug, description: s.description ?? "",
                      category: s.category, price: s.price_paise / 100, mrp: s.mrp_paise / 100,
                      image_url: s.image_url ?? "", stock: s.stock, active: s.active,
                      sort_order: s.sort_order, tags: (s.tags ?? []).join(", "),
                    })}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) del.mutate(s.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )
        )
      )}
    </div>
  );
}
