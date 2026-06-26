import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, ShoppingBag, CalendarCheck, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const items = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/astrology", key: "nav.astro", icon: Sparkles },
  { to: "/samagri", key: "nav.store", icon: ShoppingBag },
  { to: "/bookings", key: "nav.bookings", icon: CalendarCheck },
  { to: "/profile", key: "nav.me", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-card/90 backdrop-blur-xl">
      <ul className="grid grid-cols-5">
        {items.map(({ to, key, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px]"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                    active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {t(key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
