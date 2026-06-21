import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { Calendar } from "@/components/ui/calendar";
import { Sun, Moon, Sparkles, CalendarDays, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/festivals")({
  head: () => ({
    meta: [
      { title: "Festivals & Muhurat — Pranam" },
      { name: "description", content: "Hindu festival calendar and daily Choghadiya muhurat — find the auspicious time for any ritual." },
      { property: "og:title", content: "Festivals & Muhurat — Pranam" },
      { property: "og:description", content: "Calendar of festivals and Choghadiya muhurat timings." },
    ],
  }),
  component: FestivalsPage,
});

type FestivalType = "major" | "vrat" | "ekadashi" | "amavasya" | "purnima";
type Festival = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD (local)
  type: FestivalType;
  note: string;
  pooja?: { slug: string; label: string };
};

const TYPE_STYLE: Record<FestivalType, string> = {
  major: "bg-primary/15 text-primary",
  vrat: "bg-amber-100 text-amber-800",
  ekadashi: "bg-emerald-100 text-emerald-800",
  amavasya: "bg-slate-200 text-slate-700",
  purnima: "bg-yellow-100 text-yellow-800",
};

// Local YYYY-MM-DD (avoids UTC drift from toISOString)
function toLocalISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
// Parse YYYY-MM-DD as a local date (not UTC)
function parseLocalDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Choghadiya periods — auspiciousness
const CHOG_KIND: Record<string, "good" | "bad" | "neutral"> = {
  Amrit: "good", Shubh: "good", Labh: "good",
  Char: "neutral",
  Rog: "bad", Kaal: "bad", Udveg: "bad",
};

const DAY_CHOG: string[][] = [
  ["Udveg","Char","Labh","Amrit","Kaal","Shubh","Rog","Udveg"],
  ["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"],
  ["Rog","Udveg","Char","Labh","Amrit","Kaal","Shubh","Rog"],
  ["Labh","Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh"],
  ["Shubh","Rog","Udveg","Char","Labh","Amrit","Kaal","Shubh"],
  ["Char","Labh","Amrit","Kaal","Shubh","Rog","Udveg","Char"],
  ["Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit","Kaal"],
];

const NIGHT_CHOG: string[][] = [
  ["Shubh","Amrit","Char","Rog","Kaal","Labh","Udveg","Shubh"],
  ["Char","Rog","Kaal","Labh","Udveg","Shubh","Amrit","Char"],
  ["Kaal","Labh","Udveg","Shubh","Amrit","Char","Rog","Kaal"],
  ["Udveg","Shubh","Amrit","Char","Rog","Kaal","Labh","Udveg"],
  ["Amrit","Char","Rog","Kaal","Labh","Udveg","Shubh","Amrit"],
  ["Rog","Kaal","Labh","Udveg","Shubh","Amrit","Char","Rog"],
  ["Labh","Udveg","Shubh","Amrit","Char","Rog","Kaal","Labh"],
];

function fmtTime(h: number, m: number) {
  const mm = Math.round(m);
  const totalH = h + Math.floor(mm / 60);
  const min = mm % 60;
  const hr12 = ((totalH + 11) % 12) + 1;
  const ampm = totalH % 24 < 12 ? "AM" : "PM";
  return `${hr12}:${String(min).padStart(2, "0")} ${ampm}`;
}

function buildChoghadiya(date: Date) {
  const dow = date.getDay();
  const day = DAY_CHOG[dow].map((name, i) => {
    const start = 6 * 60 + i * 90;
    const end = start + 90;
    return { name, kind: CHOG_KIND[name], start: fmtTime(Math.floor(start / 60), start % 60), end: fmtTime(Math.floor(end / 60), end % 60) };
  });
  const night = NIGHT_CHOG[dow].map((name, i) => {
    const start = 18 * 60 + i * 90;
    const end = start + 90;
    return { name, kind: CHOG_KIND[name], start: fmtTime(Math.floor(start / 60), start % 60), end: fmtTime(Math.floor(end / 60), end % 60) };
  });
  return { day, night };
}

function FestivalsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [tab, setTab] = useState<"calendar" | "muhurat">("calendar");

  const { data: festivals = [] } = useQuery({
    queryKey: ["festivals"],
    queryFn: async (): Promise<Festival[]> => {
      const { data, error } = await supabase
        .from("festivals")
        .select("*")
        .eq("visible", true)
        .order("festival_date");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        date: r.festival_date,
        type: r.type as FestivalType,
        note: r.note ?? "",
        pooja: r.pooja_slug ? { slug: r.pooja_slug, label: r.pooja_label ?? r.pooja_slug } : undefined,
      }));
    },
  });

  const isoSelected = toLocalISO(date);
  const selectedFestivals = festivals.filter((f) => f.date === isoSelected);
  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return festivals
      .map((f) => ({ ...f, ts: parseLocalDate(f.date).getTime() }))
      .filter((f) => f.ts >= today.getTime())
      .sort((a, b) => a.ts - b.ts);
  }, [festivals]);

  const festivalDates = useMemo(() => festivals.map((f) => parseLocalDate(f.date)), [festivals]);
  const chog = useMemo(() => buildChoghadiya(date), [date]);

  return (
    <MobileShell>
      <TopBar title="Festivals & Muhurat" subtitle="Calendar · Choghadiya · auspicious timings" />

      <div className="px-5 pt-4">
        <div className="flex gap-2 rounded-full border border-border bg-card p-1">
          {(["calendar", "muhurat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-full py-2 text-xs font-semibold capitalize",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {t === "calendar" ? "Festival Calendar" : "Muhurat"}
            </button>
          ))}
        </div>
      </div>

      {tab === "calendar" ? (
        <section className="px-5 pt-4">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card p-2 shadow-soft">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              modifiers={{ festival: festivalDates }}
              modifiersClassNames={{ festival: "relative font-bold text-primary after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary" }}
              className="pointer-events-auto"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">
                {date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h3>
            </div>
            {selectedFestivals.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No major festival — a regular day. Pick another date or check muhurat.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {selectedFestivals.map((f) => (
                  <FestivalCard key={f.id} f={f} active />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold">Upcoming festivals</h3>
            <div className="mt-3 space-y-3">
              {upcoming.slice(0, 8).map((f) => (
                <FestivalCard key={f.id} f={f} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="px-5 pt-4 pb-6">
          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Choghadiya for
            </div>
            <p className="mt-1 text-base font-bold">
              {date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Based on local sunrise ~6:00 AM, sunset ~6:00 PM. For exact muhurat, consult a pandit.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
              <Legend kind="good" label="Auspicious" />
              <Legend kind="neutral" label="Neutral" />
              <Legend kind="bad" label="Avoid" />
            </div>
          </div>

          <ChogList title="Day Choghadiya" icon={<Sun className="h-4 w-4 text-marigold" />} items={chog.day} />
          <ChogList title="Night Choghadiya" icon={<Moon className="h-4 w-4 text-primary" />} items={chog.night} />

          <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-sm font-bold">Need a personalised muhurat?</p>
            <p className="mt-1 text-xs text-muted-foreground">For weddings, griha pravesh or naming ceremony, our pandits give a tithi-shuddha muhurat as per your kundli.</p>
            <Link to="/astrology" className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              Ask an astrologer <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}
    </MobileShell>
  );
}

function FestivalCard({ f }: { f: Festival }) {
  const d = parseLocalDate(f.date);
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", TYPE_STYLE[f.type])}>{f.type}</span>
            <span className="text-[11px] text-muted-foreground">
              {d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          <h4 className="mt-1.5 text-sm font-bold">{f.name}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{f.note}</p>
        </div>
      </div>
      {f.pooja && (
        <Link
          to="/poojas/$slug"
          params={{ slug: f.pooja.slug }}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-secondary-foreground"
        >
          Book {f.pooja.label} <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </article>
  );
}

function ChogList({ title, icon, items }: { title: string; icon: React.ReactNode; items: { name: string; kind: "good" | "bad" | "neutral"; start: string; end: string }[] }) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
        {items.map((p, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  p.kind === "good" && "bg-emerald-500",
                  p.kind === "neutral" && "bg-amber-400",
                  p.kind === "bad" && "bg-rose-500",
                )}
              />
              <span className="text-sm font-semibold">{p.name}</span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{p.start} – {p.end}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({ kind, label }: { kind: "good" | "neutral" | "bad"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2 py-1 text-[10px] font-semibold">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          kind === "good" && "bg-emerald-500",
          kind === "neutral" && "bg-amber-400",
          kind === "bad" && "bg-rose-500",
        )}
      />
      {label}
    </span>
  );
}
