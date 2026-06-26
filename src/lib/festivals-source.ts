import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Shared source for upcoming festivals so the home strip and the festivals
// screen stay in sync. Dates come from the Supabase festivals table (real
// panchang dates). Day counts are always computed against the device's current
// date, so "Today" and "in X days" are never stale.

export type UpcomingFestival = {
  id: string;
  name: string;
  date: string; // ISO yyyy-mm-dd
  label: string; // short display, e.g. "29 Jul"
  daysFromNow: number; // 0 means today
  poojaSlug?: string;
  poojaLabel?: string;
};

type FestivalRow = {
  id: string;
  name: string;
  festival_date: string;
  pooja_slug: string | null;
  pooja_label: string | null;
  visible: boolean | null;
};

// Safety net used only when the festivals table cannot be reached. These mirror
// the database seed so the app still shows correct, real dates while offline.
const FALLBACK: Array<{ name: string; date: string; pooja_slug?: string; pooja_label?: string }> = [
  { name: "Guru Purnima", date: "2026-07-29" },
  { name: "Nag Panchami", date: "2026-08-17" },
  { name: "Raksha Bandhan", date: "2026-08-27" },
  { name: "Krishna Janmashtami", date: "2026-09-03" },
  { name: "Hartalika Teej", date: "2026-09-13" },
  { name: "Ganesh Chaturthi", date: "2026-09-14", pooja_slug: "ganesh-pooja", pooja_label: "Ganesh Pooja" },
  { name: "Anant Chaturdashi", date: "2026-09-25" },
  { name: "Sharad Navratri begins", date: "2026-10-12" },
  { name: "Durga Ashtami", date: "2026-10-19" },
  { name: "Vijayadashami (Dussehra)", date: "2026-10-20" },
  { name: "Karwa Chauth", date: "2026-10-29" },
  { name: "Dhanteras", date: "2026-11-06", pooja_slug: "lakshmi-pooja", pooja_label: "Lakshmi Pooja" },
  { name: "Diwali (Lakshmi Pujan)", date: "2026-11-08", pooja_slug: "lakshmi-pooja", pooja_label: "Lakshmi Pooja" },
  { name: "Govardhan Puja", date: "2026-11-10" },
  { name: "Bhai Dooj", date: "2026-11-11" },
  { name: "Tulsi Vivah", date: "2026-11-21" },
  { name: "Kartik Purnima", date: "2026-11-23" },
  { name: "Makar Sankranti", date: "2027-01-14" },
  { name: "Vasant Panchami", date: "2027-02-01" },
  { name: "Maha Shivratri", date: "2027-02-15", pooja_slug: "rudrabhishek", pooja_label: "Rudrabhishek" },
  { name: "Holi", date: "2027-03-03" },
];

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysFromToday(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseLocalDate(iso);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function shortLabel(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function toUpcoming(rows: Array<{ id: string; name: string; date: string; poojaSlug?: string; poojaLabel?: string }>): UpcomingFestival[] {
  return rows
    .map((r) => ({
      id: r.id,
      name: r.name,
      date: r.date,
      label: shortLabel(r.date),
      daysFromNow: daysFromToday(r.date),
      poojaSlug: r.poojaSlug,
      poojaLabel: r.poojaLabel,
    }))
    .filter((f) => f.daysFromNow >= 0)
    .sort((a, b) => a.daysFromNow - b.daysFromNow);
}

/**
 * Returns upcoming festivals (today onwards), soonest first.
 * @param limit optional cap on how many to return.
 */
export function useUpcomingFestivals(limit?: number) {
  const query = useQuery({
    queryKey: ["festivals"],
    queryFn: async (): Promise<UpcomingFestival[]> => {
      const { data, error } = await supabase
        .from("festivals")
        .select("*")
        .eq("visible", true)
        .order("festival_date");
      if (error) throw error;
      return toUpcoming(
        (data ?? []).map((r: FestivalRow) => ({
          id: r.id,
          name: r.name,
          date: r.festival_date,
          poojaSlug: r.pooja_slug ?? undefined,
          poojaLabel: r.pooja_label ?? undefined,
        })),
      );
    },
  });

  const fallback = toUpcoming(FALLBACK.map((f, i) => ({ id: `fb-${i}`, name: f.name, date: f.date, poojaSlug: f.pooja_slug, poojaLabel: f.pooja_label })));
  const list = query.data && query.data.length > 0 ? query.data : fallback;

  return {
    festivals: typeof limit === "number" ? list.slice(0, limit) : list,
    loading: query.isLoading,
  };
}
