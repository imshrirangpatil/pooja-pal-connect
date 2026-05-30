import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, ShoppingBag, CalendarCheck, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/astrology", label: "Astro", icon: Sparkles },
  { to: "/samagri", label: "Store", icon: ShoppingBag },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/profile", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-card/90 backdrop-blur-xl">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px]"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                    active ? "bg-gradient-warm text-primary-foreground shadow-glow" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
