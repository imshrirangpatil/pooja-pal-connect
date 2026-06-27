import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/pranam-logo.png.asset.json";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Pranam - Pandit, Pooja & Astrology" },
      { name: "description", content: "Book verified pandits, get samagri delivered, and consult trusted astrologers across India." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const [loaded, setLoaded] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center bg-cream px-8">
      <div
        className={`flex flex-col items-center transition-all duration-1000 ${
          loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <img
          src={logoAsset.url}
          alt="Pranam logo"
          className="h-64 w-64 object-contain"
        />
        <p className="mt-2 text-center text-sm font-medium leading-relaxed text-foreground/80">
          {t("welcome.tagline")}
        </p>
      </div>

      <div
        className={`mt-10 w-full transition-all duration-1000 delay-300 ${
          loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Link
          to="/signup"
          className="flex h-14 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-glow"
        >
          {t("welcome.getStarted")}
        </Link>
        <Link
          to="/"
          className="mt-4 block text-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t("welcome.skip")}
        </Link>
      </div>

      <p className="absolute bottom-8 text-[11px] text-muted-foreground">
        🪔 {t("welcome.madeWithDevotion")}
      </p>
    </div>
  );
}
