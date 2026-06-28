import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pandits as seedPandits, type Pandit } from "@/lib/data";

// DB-backed pandits with the static seed as the immediate fallback (like usePoojas),
// so screens never flash empty and existing ids (the `ref`, e.g. p1..p4) stay stable
// for reviews, saved-pandits and bookings.

type PanditRow = {
  ref: string | null;
  name: string;
  city: string | null;
  experience: number | null;
  rating: number | null;
  reviews: number | null;
  languages: unknown;
  specialties: unknown;
  pooja_slugs: unknown;
  bio: string | null;
  fee_from: number | null;
  verified: boolean | null;
  initials: string | null;
  photo_url: string | null;
};

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

function rowToPandit(r: PanditRow): Pandit {
  return {
    id: r.ref ?? r.name,
    name: r.name,
    city: r.city ?? "",
    experience: r.experience ?? 0,
    rating: Number(r.rating ?? 0),
    reviews: r.reviews ?? 0,
    languages: arr(r.languages),
    specialties: arr(r.specialties),
    poojaSlugs: arr(r.pooja_slugs),
    bio: r.bio ?? "",
    feeFrom: r.fee_from ?? 0,
    verified: true,
    initials: r.initials ?? "",
    photoUrl: r.photo_url,
  };
}

export function usePandits() {
  const [pandits, setPandits] = useState<Pandit[]>(seedPandits);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const base = "ref, name, city, experience, rating, reviews, languages, specialties, pooja_slugs, bio, fee_from, verified, initials";
      // photo_url arrives in a later migration. Try with it, and if the column
      // is not there yet, fall back to the base columns so the pandits list (and
      // any newly approved pandits) still loads instead of dropping to the seed.
      let { data, error } = await (supabase as any)
        .from("pandits")
        .select(`${base}, photo_url`)
        .eq("visible", true)
        .order("rating", { ascending: false });
      if (error) {
        ({ data, error } = await (supabase as any)
          .from("pandits")
          .select(base)
          .eq("visible", true)
          .order("rating", { ascending: false }));
      }
      if (cancelled) return;
      if (!error && data && data.length > 0) {
        setPandits((data as PanditRow[]).map(rowToPandit));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { pandits, loading };
}
