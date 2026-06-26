import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RatingSummary = { avg: number; count: number };

// Aggregate real pandit ratings from the reviews table once and index by pandit
// id, so list and detail screens can show true averages instead of seeded values.
// Reviews are readable by signed-in users; signed-out visitors get an empty map
// and screens fall back to a "New" label.
export function usePanditRatings(): Record<string, RatingSummary> {
  const q = useQuery({
    queryKey: ["pandit-ratings"],
    queryFn: async (): Promise<Record<string, RatingSummary>> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("target_id, rating")
        .eq("target_kind", "pandit");
      if (error) throw error;
      const acc: Record<string, { sum: number; n: number }> = {};
      for (const r of (data ?? []) as { target_id: string; rating: number }[]) {
        const a = acc[r.target_id] ?? { sum: 0, n: 0 };
        a.sum += r.rating;
        a.n += 1;
        acc[r.target_id] = a;
      }
      const out: Record<string, RatingSummary> = {};
      for (const k of Object.keys(acc)) out[k] = { avg: acc[k].sum / acc[k].n, count: acc[k].n };
      return out;
    },
    staleTime: 60_000,
  });
  return q.data ?? {};
}
