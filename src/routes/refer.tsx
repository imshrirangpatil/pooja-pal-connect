import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Gift, Copy, Share2, Users, Check } from "lucide-react";

export const Route = createFileRoute("/refer")({
  head: () => ({
    meta: [
      { title: "Refer & Earn — Pranam" },
      { name: "description", content: "Refer friends to Pranam and earn ₹100 in credits per signup." },
    ],
  }),
  component: ReferPage,
});

type Profile = { referral_code: string | null; referred_by: string | null };

function ReferPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const profileQ = useQuery({
    queryKey: ["profile-referral", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code, referred_by")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? { referral_code: null, referred_by: null }) as Profile;
    },
  });

  const referralsQ = useQuery({
    queryKey: ["my-referrals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const earnedQ = useQuery({
    queryKey: ["referral-earnings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credits_ledger")
        .select("amount_paise")
        .eq("user_id", user!.id)
        .eq("kind", "referral_reward");
      if (error) throw error;
      return (data ?? []).reduce((s, r: any) => s + (r.amount_paise ?? 0), 0);
    },
  });

  const applyMut = useMutation({
    mutationFn: async (input: string) => {
      const { data, error } = await supabase.rpc("apply_referral_code", { _code: input.trim().toUpperCase() });
      if (error) throw error;
      const res = data as { ok: boolean; error?: string; referee_credits_paise?: number };
      if (!res.ok) throw new Error(res.error || "Could not apply code");
      return res;
    },
    onSuccess: (res) => {
      toast.success(`₹${(res.referee_credits_paise ?? 0) / 100} credited to your wallet!`);
      setCode("");
      qc.invalidateQueries({ queryKey: ["profile-referral"] });
      qc.invalidateQueries({ queryKey: ["credit-balance"] });
      qc.invalidateQueries({ queryKey: ["credits-ledger"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && !user) {
    return (
      <MobileShell>
        <TopBar title="Refer & Earn" />
        <div className="mx-5 mt-10 rounded-2xl bg-card p-6 text-center shadow-soft">
          <Gift className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm font-semibold">Sign in to get your referral code</p>
          <Link to="/welcome" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground">
            Sign in
          </Link>
        </div>
      </MobileShell>
    );
  }

  const myCode = profileQ.data?.referral_code ?? "";
  const alreadyReferred = !!profileQ.data?.referred_by;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/welcome?ref=${myCode}` : "";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const onShare = async () => {
    const text = `Join me on Pranam — book pandits, poojas & astrology. Use my code ${myCode} to get ₹50 off your first order. ${shareUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pranam — Refer & Earn", text, url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Share message copied!");
    }
  };

  return (
    <MobileShell>
      <TopBar title="Refer & Earn" />

      <section className="mx-5 mt-4 rounded-3xl bg-primary p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
          <Gift className="h-3.5 w-3.5" /> Refer & Earn
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight">Give ₹50, Get ₹100</h1>
        <p className="mt-1 text-xs opacity-90">Share your code. Friends get ₹50 off their first order, you earn ₹100 in credits when they sign up.</p>
      </section>

      <section className="mx-5 mt-5 rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your referral code</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 rounded-xl border-2 border-dashed border-primary/40 bg-secondary px-4 py-3 text-center text-lg font-bold tracking-[0.2em] text-secondary-foreground">
            {myCode || "—"}
          </div>
          <button
            onClick={onCopy}
            disabled={!myCode}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-accent disabled:opacity-40"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <button
          onClick={onShare}
          disabled={!myCode}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          <Share2 className="h-4 w-4" /> Share with friends
        </button>
      </section>

      <section className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <Users className="h-4 w-4 text-accent" />
          <p className="mt-2 text-2xl font-bold">{referralsQ.data ?? 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Friends joined</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <Gift className="h-4 w-4 text-accent" />
          <p className="mt-2 text-2xl font-bold">₹{((earnedQ.data ?? 0) / 100).toLocaleString("en-IN")}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total earned</p>
        </div>
      </section>

      {!alreadyReferred && (
        <section className="mx-5 mt-5 rounded-2xl bg-card p-4 shadow-soft">
          <p className="text-sm font-bold">Have a referral code?</p>
          <p className="mt-1 text-xs text-muted-foreground">Apply a friend's code to get ₹50 in credits.</p>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              maxLength={20}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold tracking-widest outline-none focus:border-primary"
            />
            <button
              onClick={() => applyMut.mutate(code)}
              disabled={code.trim().length < 4 || applyMut.isPending}
              className="rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              {applyMut.isPending ? "Applying…" : "Apply"}
            </button>
          </div>
        </section>
      )}

      <section className="mx-5 mt-5 rounded-2xl bg-secondary p-4">
        <p className="text-sm font-bold text-secondary-foreground">How it works</p>
        <ol className="mt-2 space-y-2 text-xs text-secondary-foreground/90">
          <li><span className="font-semibold">1.</span> Share your code with friends & family.</li>
          <li><span className="font-semibold">2.</span> They sign up and apply your code.</li>
          <li><span className="font-semibold">3.</span> They get ₹50, you get ₹100 — instantly.</li>
        </ol>
      </section>

      <div className="h-6" />
    </MobileShell>
  );
}
