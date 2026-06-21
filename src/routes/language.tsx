import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { ArrowLeft, Check, Globe } from "lucide-react";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/language")({
  head: () => ({
    meta: [
      { title: "App Language — Pranam" },
      { name: "description", content: "Choose your preferred app language." },
    ],
  }),
  component: LanguagePage,
});

function LanguagePage() {
  const { lang, setLang, t } = useI18n();

  const choose = (code: LangCode) => {
    setLang(code);
    const next = LANGUAGES.find((l) => l.code === code);
    toast.success(`${t("language.saved")} · ${next?.native ?? code}`);
  };

  return (
    <MobileShell>
      <TopBar
        title={t("language.title")}
        subtitle={t("language.sub")}
        right={
          <Link
            to="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <div className="px-5 pt-4 pb-10">
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-secondary-foreground shadow-soft">
          <Globe className="h-4 w-4" />
          <p className="text-xs">
            Pranam works in your language across menus, profile, support and key flows.
          </p>
        </div>

        <div className="space-y-1.5">
          {LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => choose(l.code)}
                className={`flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-soft transition ${
                  active ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {l.code.toUpperCase()}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{l.native}</span>
                  <span className="block text-[11px] text-muted-foreground">{l.name}</span>
                </span>
                {active && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          More translations are rolling out. Astrology chats and pandit conversations
          continue in the language you prefer.
        </p>
      </div>
    </MobileShell>
  );
}
