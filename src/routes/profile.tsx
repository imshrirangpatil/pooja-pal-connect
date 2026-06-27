import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { Gift, HelpCircle, FileText, Globe, Bell, ChevronRight, LogOut, Heart, Wallet, Package, MapPin, ShieldCheck, BadgeIndianRupee, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { useSavedPandits } from "@/lib/saved-pandits";
import { getInitials } from "@/lib/utils";
import { useMyPandit } from "@/lib/my-pandit";
import { LogIn } from "lucide-react";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile - Pranam" },
      { name: "description", content: "Your Pranam account, wallet and preferences." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const { ids: savedPanditIds } = useSavedPandits();
  const { pandit: myPandit } = useMyPandit();
  const { theme, toggle: toggleTheme } = useTheme();

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";
  const initial = getInitials(fullName) || "G";
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email?.split("@")[0] ?? "Guest");
  const phone = user?.phone ? `+${user.phone}` : (user?.email ?? "Not signed in");

  const balanceQ = useQuery({
    queryKey: ["credit-balance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_credit_balance", { _user_id: user!.id });
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });
  const walletDisplay = user ? `₹${((balanceQ.data ?? 0) / 100).toLocaleString("en-IN")}` : "₹0";

  const ordersCountQ = useQuery({
    queryKey: ["orders-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase.from("orders").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
  const bookingsValue = user ? String(ordersCountQ.data ?? 0) : "0";
  const savedValue = String(savedPanditIds.length);

  const langNative = LANGUAGES.find((l) => l.code === lang)?.native ?? "English";

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/welcome" });
  };

  return (
    <MobileShell>
      <TopBar title={t("profile.title")} />

      <section className="mx-5 mt-4 rounded-3xl bg-secondary p-5 text-secondary-foreground shadow-glow">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{name}</p>
            <p className="truncate text-xs opacity-90">{phone}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Stat label={t("profile.bookings")} value={bookingsValue} />
          <Stat label={t("profile.wallet")} value={walletDisplay} />
          <Stat label={t("profile.saved")} value={savedValue} />
        </div>
      </section>

      {!user && (
        <Link to="/welcome" className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-glow">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/15">
            <LogIn className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">Sign in to Pranam</p>
            <p className="text-xs opacity-90">Save bookings, orders and chats across your devices.</p>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}

      {isAdmin && (
        <Link to="/admin" className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-primary p-3.5 text-primary-foreground shadow-glow">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">{t("profile.admin")}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}

      {myPandit && (
        <Link to="/pandit" className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent">
            <BadgeIndianRupee className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-semibold">Pandit portal, profile and earnings</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div className="mt-5 space-y-1 px-5">
        <Row to="/orders" icon={<Package className="h-4 w-4" />} label={t("profile.orders")} />
        <Row to="/wallet" icon={<Wallet className="h-4 w-4" />} label={t("profile.walletCredits")} hint={walletDisplay} />
        <Row to="/saved-pandits" icon={<Heart className="h-4 w-4" />} label={t("profile.savedPandits")} hint={savedPanditIds.length ? String(savedPanditIds.length) : undefined} />
        <Row to="/refer" icon={<Gift className="h-4 w-4" />} label={t("profile.refer")} />
        <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-2xl bg-card p-3.5 text-left shadow-soft">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-accent">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </span>
          <span className="flex-1 text-sm font-medium">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          <span className="text-xs text-muted-foreground">{theme === "dark" ? "On" : "Off"}</span>
        </button>
        <Row to="/language" icon={<Globe className="h-4 w-4" />} label={t("profile.language")} hint={langNative} />
        <Row to="/support" icon={<HelpCircle className="h-4 w-4" />} label={t("profile.support")} />
        <Row to="/terms" icon={<FileText className="h-4 w-4" />} label={t("profile.terms")} />
      </div>


      <div className="mx-5 mt-6 rounded-2xl border border-border/60 bg-card p-4 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("profile.becomePartner")}</p>
        <h3 className="mt-1 text-base font-bold">{t("profile.partnerCta")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("profile.partnerSub")}</p>
        <Link to="/become-pandit" className="mt-3 block w-full rounded-full bg-foreground py-2.5 text-center text-xs font-semibold text-background">{t("profile.applyNow")}</Link>
      </div>

      {user && (
        <button onClick={handleLogout} className="mx-auto mt-6 flex items-center gap-2 text-sm font-medium text-accent">
          <LogOut className="h-4 w-4" /> {t("profile.logout")}
        </button>
      )}
      <p className="mt-3 pb-2 text-center text-[10px] text-muted-foreground">Pranam v1.0 · Made in India</p>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-background/15 p-2.5 text-center backdrop-blur">
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] opacity-85">{label}</p>
    </div>
  );
}

type RowTo = "/orders" | "/addresses" | "/wallet" | "/refer" | "/support" | "/saved-pandits" | "/language" | "/terms" | "/notifications";

function Row({ icon, label, hint, to }: { icon: React.ReactNode; label: string; hint?: string; to?: RowTo }) {
  const inner = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-accent">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </>
  );
  const cls = "flex w-full items-center gap-3 rounded-2xl bg-card p-3.5 text-left shadow-soft";
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button className={cls}>{inner}</button>;
}
