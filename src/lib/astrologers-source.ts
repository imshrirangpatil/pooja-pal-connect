import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { astrologers as seedAstrologers, type Astrologer, type AstroCategory } from "@/lib/data";

// DB-backed astrologers with the static seed as the immediate fallback, keyed by a
// stable ref (a1..a4) so astro chat sessions and reviews keep working.

type AstrologerRow = {
  ref: string | null;
  name: string;
  expertise: string | null;
  category: string | null;
  experience: number | null;
  rating: number | null;
  price_per_min: number | null;
  languages: unknown;
  online: boolean | null;
  initials: string | null;
};

function rowToAstrologer(r: AstrologerRow): Astrologer {
  return {
    id: r.ref ?? r.name,
    name: r.name,
    expertise: r.expertise ?? "",
    category: (r.category as AstroCategory) ?? "Vedic",
    experience: r.experience ?? 0,
    rating: Number(r.rating ?? 0),
    pricePerMin: r.price_per_min ?? 0,
    languages: Array.isArray(r.languages) ? (r.languages as string[]) : [],
    online: r.online ?? false,
    initials: r.initials ?? "",
  };
}

export function useAstrologers() {
  const [astrologers, setAstrologers] = useState<Astrologer[]>(seedAstrologers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("astrologers")
        .select("ref, name, expertise, category, experience, rating, price_per_min, languages, online, initials")
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (!error && data && data.length > 0) {
        setAstrologers((data as AstrologerRow[]).map(rowToAstrologer));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { astrologers, loading };
}
