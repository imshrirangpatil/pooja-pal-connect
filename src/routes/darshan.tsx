import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { useI18n } from "@/lib/i18n";
import { Video, MapPin, ChevronRight, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/darshan")({
  head: () => ({
    meta: [
      { title: "Live Mandir Darshan & Live Pooja - Pranam" },
      { name: "description", content: "Watch live aarti and darshan from famous Indian temples, and join live poojas streamed straight to your phone." },
    ],
  }),
  component: DarshanPage,
});

// Live darshan feeds use each temple channel's current live stream, so the embed
// keeps working even when a new stream starts. Channels are public devotional or
// official temple channels. Swap a channelId here to point at a different feed.
type Temple = {
  id: string;
  name: string;
  city: string;
  channelId: string;
  source: string;
};

const TEMPLES: Temple[] = [
  { id: "somnath", name: "Shri Somnath Jyotirlinga", city: "Gir Somnath", channelId: "UCDgoIPOfSzMu-PEVlSZInQg", source: "Somnath Live Darshan" },
  { id: "tirupati", name: "Shri Tirupati Balaji", city: "Tirumala", channelId: "UCTboTRX74UydvU_cBdm_cCQ", source: "SVBC TTD" },
  { id: "mahakal", name: "Shri Mahakaleshwar", city: "Ujjain", channelId: "UCXhail7h5FDRbHprlR56nIw", source: "Bhakti Live" },
  { id: "kashi", name: "Shri Kashi Vishwanath", city: "Varanasi", channelId: "UCXhail7h5FDRbHprlR56nIw", source: "Bhakti Live" },
  { id: "vaishnodevi", name: "Shri Mata Vaishno Devi", city: "Katra", channelId: "UCcB8oTdZp0qJsWyff0kTWJg", source: "SMVDSB Official" },
  { id: "bankebihari", name: "Shri Banke Bihari", city: "Vrindavan", channelId: "UCPS3fMz-iUvKfw2kT9mtFjg", source: "Banke Bihari Live" },
  { id: "iskcon", name: "ISKCON Krishna Darshan", city: "Bengaluru", channelId: "UCPXnayBvF7ynbG_I3VOTgIg", source: "ISKCON Bangalore" },
];

function embedUrl(channelId: string) {
  return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&playsinline=1`;
}
function watchUrl(channelId: string) {
  return `https://www.youtube.com/channel/${channelId}/live`;
}

function DarshanPage() {
  const [selected, setSelected] = useState<Temple>(TEMPLES[0]);
  const { t } = useI18n();

  return (
    <MobileShell>
      <TopBar title={t("darshan.title")} subtitle={t("darshan.subtitle")} />

      <section className="px-5 pt-4">
        <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-soft">
          <div className="relative aspect-video w-full bg-black">
            <iframe
              key={selected.id}
              src={embedUrl(selected.channelId)}
              title={`${selected.name} live darshan`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold">{selected.name}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {selected.city}
                <span className="opacity-50">·</span>
                {selected.source}
              </p>
            </div>
            <a
              href={watchUrl(selected.channelId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-card px-3 py-2 text-xs font-semibold text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" /> YouTube
            </a>
          </div>
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          {t("darshan.feedNote")}
        </p>
      </section>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{t("darshan.chooseTemple")}</h3>
          <span className="text-[11px] text-muted-foreground">{t("darshan.liveFeeds").replace("{n}", String(TEMPLES.length))}</span>
        </div>
        <div className="mt-3 space-y-2">
          {TEMPLES.map((temple) => {
            const active = temple.id === selected.id;
            return (
              <button
                key={temple.id}
                onClick={() => setSelected(temple)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-soft transition ${
                  active ? "border-primary bg-primary/5" : "border-border/60 bg-card"
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  <Video className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{temple.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {temple.city}
                  </p>
                </div>
                {active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> {t("darshan.live")}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-5 mt-6 mb-6 rounded-3xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{t("darshan.privatePooja")}</p>
        <h3 className="mt-1 text-base font-bold">{t("darshan.privateTitle")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("darshan.privateSub")}</p>
        <Link to="/poojas" className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
          {t("home.browsePoojas")} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </MobileShell>
  );
}
