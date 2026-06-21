import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, BarChart3, Package, Users, Sparkles, UserCheck, Inbox, CalendarDays, LifeBuoy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Pranam" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { to: "/admin/orders", label: "Orders", icon: Package, exact: false },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  { to: "/admin/poojas", label: "Poojas", icon: Sparkles, exact: false },
  { to: "/admin/pandits", label: "Pandits", icon: UserCheck, exact: false },
  { to: "/admin/applications", label: "Applications", icon: Inbox, exact: false },
  { to: "/admin/festivals", label: "Festivals", icon: CalendarDays, exact: false },
  { to: "/admin/tickets", label: "Tickets", icon: LifeBuoy, exact: false },
] as const;

function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/signup" });
  }, [loading, user, navigate]);

  if (loading || roleLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold">Admins only</h1>
        <p className="text-sm text-muted-foreground">You don't have access to the admin dashboard.</p>
        <Link to="/" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Go home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-base font-bold">Admin Dashboard</h1>
            <p className="text-[11px] text-muted-foreground">Pranam Console</p>
          </div>
        </div>
        <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
