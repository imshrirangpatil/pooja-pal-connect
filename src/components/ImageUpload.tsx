import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

// Uploads an image to the public `catalog` storage bucket and returns its public
// URL. Admin-only (enforced by storage RLS). Used in the admin Poojas and SKU
// editors so the imported drafts can get real images.
export function ImageUpload({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder: string }) {
  const [busy, setBusy] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${folder}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
      const { error } = await supabase.storage.from("catalog").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("catalog").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-card px-3 py-2 text-xs font-semibold">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy ? "Uploading…" : "Upload image"}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
      </label>
    </div>
  );
}
