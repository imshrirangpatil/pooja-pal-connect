import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Bell, CheckCheck, BellOff, LogIn } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications - Pranam" },
      { name: "description", content: "Your booking, order and payment updates in one place." },
    ],
  }),
  component: NotificationsPage,
});

function timeAgo(iso: string, t: (k: string, f?: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notif.justNow");
  if (mins < 60) return t("notif.minutesAgo").replace("{n}", String(mins));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("notif.hoursAgo").replace("{n}", String(hrs));
  const days = Math.floor(hrs / 24);
  if (days < 7) return t("notif.daysAgo").replace("{n}", String(days));
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] });

  if (!authLoading && !user) {
    return (
      <MobileShell>
        <TopBar title={t("notif.title")} right={<BackButton fallback="/profile" className="h-10 w-10 border border-border bg-card" />} />
        <div className="px-5 pt-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-accent">
            <Bell className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold">{t("notif.signInTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("notif.signInSub")}</p>
          <button
            onClick={() => navigate({ to: "/welcome" })}
            className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <LogIn className="h-4 w-4" /> {t("profile.signIn")}
          </button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <TopBar
        title={t("notif.title")}
        subtitle={unreadCount ? t("notif.unread").replace("{n}", String(unreadCount)) : t("notif.allCaught")}
        right={<BackButton fallback="/profile" className="h-10 w-10 border border-border bg-card" />}
      />

      <PullToRefresh onRefresh={refresh}>
      <div className="px-5 pt-3 pb-10">
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary"
          >
            <CheckCheck className="h-3.5 w-3.5" /> {t("notif.markAll")}
          </button>
        )}

        {loading ? (
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
            <div className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-soft">
            <BellOff className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">{t("notif.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("notif.emptySub")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  if (n.link) navigate({ to: n.link } as never);
                }}
                className={`flex w-full gap-3 rounded-2xl border p-3.5 text-left shadow-soft ${
                  n.is_read ? "border-border/60 bg-card" : "border-primary/30 bg-primary/5"
                }`}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.is_read ? "bg-secondary text-accent" : "bg-primary text-primary-foreground"}`}>
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.created_at, t)}</span>
                  </div>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                </div>
                {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>
      </PullToRefresh>
    </MobileShell>
  );
}
