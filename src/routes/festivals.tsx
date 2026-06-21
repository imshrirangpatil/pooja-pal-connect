import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { Calendar } from "@/components/ui/calendar";
import { Sun, Moon, Sparkles, CalendarDays, ChevronRight, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Major Indian cities with coordinates — used for muhurat sunrise/sunset lookup
const CITIES: { label: string; lat: number; lng: number; tz: string }[] = [
  { label: "Delhi", lat: 28.6139, lng: 77.209, tz: "Asia/Kolkata" },
  { label: "Mumbai", lat: 19.076, lng: 72.8777, tz: "Asia/Kolkata" },
  { label: "Bengaluru", lat: 12.9716, lng: 77.5946, tz: "Asia/Kolkata" },
  { label: "Kolkata", lat: 22.5726, lng: 88.3639, tz: "Asia/Kolkata" },
  { label: "Chennai", lat: 13.0827, lng: 80.2707, tz: "Asia/Kolkata" },
  { label: "Hyderabad", lat: 17.385, lng: 78.4867, tz: "Asia/Kolkata" },
  { label: "Pune", lat: 18.5204, lng: 73.8567, tz: "Asia/Kolkata" },
  { label: "Ahmedabad", lat: 23.0225, lng: 72.5714, tz: "Asia/Kolkata" },
  { label: "Jaipur", lat: 26.9124, lng: 75.7873, tz: "Asia/Kolkata" },
  { label: "Lucknow", lat: 26.8467, lng: 80.9462, tz: "Asia/Kolkata" },
  { label: "Varanasi", lat: 25.3176, lng: 82.9739, tz: "Asia/Kolkata" },
  { label: "Bhopal", lat: 23.2599, lng: 77.4126, tz: "Asia/Kolkata" },
  { label: "Patna", lat: 25.5941, lng: 85.1376, tz: "Asia/Kolkata" },
  { label: "Chandigarh", lat: 30.7333, lng: 76.7794, tz: "Asia/Kolkata" },
];

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

function fmtTimeFromDate(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "AM" : "PM";
  h = ((h + 11) % 12) + 1;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Build choghadiya from actual sunrise/sunset (each period = 1/8 of day or night length)
function buildChoghadiya(date: Date, sunrise: Date, sunset: Date, nextSunrise: Date) {
  const dow = date.getDay();
  const dayLen = sunset.getTime() - sunrise.getTime();
  const nightLen = nextSunrise.getTime() - sunset.getTime();
  const dayUnit = dayLen / 8;
  const nightUnit = nightLen / 8;
  const day = DAY_CHOG[dow].map((name, i) => {
    const start = new Date(sunrise.getTime() + i * dayUnit);
    const end = new Date(sunrise.getTime() + (i + 1) * dayUnit);
    return { name, kind: CHOG_KIND[name], start: fmtTimeFromDate(start), end: fmtTimeFromDate(end) };
  });
  const night = NIGHT_CHOG[dow].map((name, i) => {
    const start = new Date(sunset.getTime() + i * nightUnit);
    const end = new Date(sunset.getTime() + (i + 1) * nightUnit);
    return { name, kind: CHOG_KIND[name], start: fmtTimeFromDate(start), end: fmtTimeFromDate(end) };
  });
  return { day, night };
}

async function fetchSunData(lat: number, lng: number, isoDate: string) {
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${isoDate}&formatted=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch sunrise data");
  const json = await res.json();
  if (json.status !== "OK") throw new Error("Bad sunrise response");
  return { sunrise: new Date(json.results.sunrise), sunset: new Date(json.results.sunset) };
}

function FestivalsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [tab, setTab] = useState<"calendar" | "muhurat">("calendar");
  const [muhuratDate, setMuhuratDate] = useState<Date>(new Date());
  const [cityIdx, setCityIdx] = useState<number>(0);
  const [customLoc, setCustomLoc] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const location = customLoc ?? CITIES[cityIdx];
  const muhuratIso = toLocalISO(muhuratDate);

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

  // Open-source sunrise/sunset for selected date + next day (for night choghadiya)
  const sunQuery = useQuery({
    queryKey: ["sun", muhuratIso, location.lat, location.lng],
    queryFn: async () => {
      const next = new Date(muhuratDate);
      next.setDate(next.getDate() + 1);
      const [today, tomorrow] = await Promise.all([
        fetchSunData(location.lat, location.lng, muhuratIso),
        fetchSunData(location.lat, location.lng, toLocalISO(next)),
      ]);
      return { sunrise: today.sunrise, sunset: today.sunset, nextSunrise: tomorrow.sunrise };
    },
    enabled: tab === "muhurat",
    staleTime: 60 * 60 * 1000,
  });

  const chog = useMemo(() => {
    if (!sunQuery.data) return null;
    return buildChoghadiya(muhuratDate, sunQuery.data.sunrise, sunQuery.data.sunset, sunQuery.data.nextSunrise);
  }, [muhuratDate, sunQuery.data]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomLoc({ label: "My location", lat: +pos.coords.latitude.toFixed(4), lng: +pos.coords.longitude.toFixed(4) });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  };

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
          {/* Date & location selectors */}
          <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Date
              </label>
              <input
                type="date"
                value={muhuratIso}
                onChange={(e) => {
                  if (e.target.value) setMuhuratDate(parseLocalDate(e.target.value));
                }}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Location
              </label>
              <div className="mt-1.5 flex gap-2">
                <select
                  value={customLoc ? -1 : cityIdx}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 0) { setCityIdx(v); setCustomLoc(null); }
                  }}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {customLoc && <option value={-1}>{customLoc.label} ({customLoc.lat}, {customLoc.lng})</option>}
                  {CITIES.map((c, i) => (
                    <option key={c.label} value={i}>{c.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={geoLoading}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Use my location"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Choghadiya for
            </div>
            <p className="mt-1 text-base font-bold">
              {muhuratDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {location.label} · {sunQuery.data
                ? `Sunrise ${fmtTimeFromDate(sunQuery.data.sunrise)} · Sunset ${fmtTimeFromDate(sunQuery.data.sunset)}`
                : "Fetching sunrise / sunset…"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
              <Legend kind="good" label="Auspicious" />
              <Legend kind="neutral" label="Neutral" />
              <Legend kind="bad" label="Avoid" />
            </div>
          </div>

          {sunQuery.isLoading || !chog ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card p-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Calculating choghadiya…
            </div>
          ) : sunQuery.isError ? (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
              Couldn't fetch sunrise data. Check your connection and try again.
            </div>
          ) : (
            <>
              <ChogList title="Day Choghadiya" icon={<Sun className="h-4 w-4 text-marigold" />} items={chog.day} />
              <ChogList title="Night Choghadiya" icon={<Moon className="h-4 w-4 text-primary" />} items={chog.night} />
            </>
          )}

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

function FestivalCard({ f, active }: { f: Festival; active?: boolean }) {
  const d = parseLocalDate(f.date);
  return (
    <article className={cn(
      "rounded-2xl border p-4 shadow-soft",
      active ? "border-primary/30 bg-primary/10" : "border-border/60 bg-card"
    )}>
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
