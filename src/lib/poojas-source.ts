import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { poojas as seedPoojas, type Pooja } from "@/lib/data";
import ganesh from "@/assets/pooja-ganesh.jpg";
import satya from "@/assets/pooja-satyanarayan.jpg";
import griha from "@/assets/pooja-griha.jpg";
import lakshmi from "@/assets/pooja-lakshmi.jpg";

const fallbackImages: Record<string, string> = {
  "ganesh-pooja": ganesh,
  "satyanarayan-katha": satya,
  "griha-pravesh": griha,
  "lakshmi-pooja": lakshmi,
};
const defaultImage = ganesh;

type PoojaRow = {
  slug: string;
  name: string;
  tagline: string | null;
  duration: string | null;
  price_from: number;
  image_url: string | null;
  popular: boolean | null;
  season: string | null;
  description: string | null;
  includes: string[] | null;
  samagri_included: boolean | null;
  visible: boolean | null;
};

export function rowToPooja(r: PoojaRow): Pooja {
  return {
    slug: r.slug,
    name: r.name,
    tagline: r.tagline ?? "",
    duration: r.duration ?? "",
    priceFrom: Number(r.price_from ?? 0),
    samagriIncluded: r.samagri_included ?? true,
    image: r.image_url || fallbackImages[r.slug] || defaultImage,
    popular: r.popular ?? false,
    season: r.season ?? undefined,
    description: r.description ?? "",
    includes: r.includes ?? [],
  };
}

export function usePoojas() {
  const [poojas, setPoojas] = useState<Pooja[]>(seedPoojas);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("poojas")
        .select("*")
        .eq("visible", true)
        .order("name", { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        setPoojas((data as PoojaRow[]).map(rowToPooja));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { poojas, loading };
}
