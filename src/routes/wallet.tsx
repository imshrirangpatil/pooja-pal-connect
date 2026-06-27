import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Gift, ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet - Pranam" },
      { name: "description", content: "View your Pranam credits balance and history." },
    ],
  }),
  component: WalletPage,
});

type LedgerRow = {
  id: string;
  amount_paise: number;
  kind: string;
  description: string | null;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  referral_reward: "Referral reward",
  referral_signup: "Welcome bonus",
  promo: "Promo credit",
  redeem: "Redeemed",
  refund: "Refund",
  adjustment: "Adjustment",
};

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function WalletPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  const balanceQ = useQuery({
    queryKey: ["credit-balance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_credit_balance", { _user_id: user!.id });
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });

  const ledgerQ = useQuery({
    queryKey: ["credits-ledger", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credits_ledger")
        .select("id, amount_paise, kind, description, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as LedgerRow[];
    },
  });

  if (!loading && !user) {
    return (
      <MobileShell>
        <TopBar title={t("wallet.title")} />
        <div className="mx-5 mt-10 rounded-2xl bg-card p-6 text-center shadow-soft">
          <Wallet className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm font-semibold">{t("profile.signIn")}</p>
          <Link to="/welcome" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground">
            {t("profile.signIn")}
          </Link>
        </div>
      </MobileShell>
    );
  }

  const balance = balanceQ.data ?? 0;
  const rows = ledgerQ.data ?? [];

  return (
    <MobileShell>
      <TopBar title={t("wallet.title")} />

      <section className="mx-5 mt-4 rounded-3xl bg-primary p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
          <Sparkles className="h-3.5 w-3.5" /> {t("wallet.credits")}
        </div>
        <p className="mt-2 text-4xl font-bold">{formatINR(balance)}</p>
        <p className="mt-1 text-xs opacity-90">Use credits at checkout for poojas, samagri & astrology.</p>
        <Link
          to="/refer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-semibold backdrop-blur"
        >
          <Gift className="h-3.5 w-3.5" /> Earn more - Refer a friend
        </Link>
      </section>

      <div className="mx-5 mt-6">
        <h2 className="mb-2 text-sm font-bold">{t("wallet.history")}</h2>
        {ledgerQ.isLoading ? (
          <div className="rounded-2xl bg-card p-5 text-center text-xs text-muted-foreground shadow-soft">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-soft">
            <p className="text-sm font-semibold">{t("wallet.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">Refer friends to earn ₹100 per signup.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const positive = r.amount_paise >= 0;
              return (
                <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      positive ? "bg-secondary text-accent" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {positive ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {r.description || KIND_LABEL[r.kind] || "Credit"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${positive ? "text-accent" : "text-destructive"}`}>
                    {positive ? "+" : ""}
                    {formatINR(r.amount_paise)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
