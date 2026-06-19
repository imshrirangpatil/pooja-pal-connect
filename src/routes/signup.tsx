import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Pranam" },
      { name: "description", content: "Create your Pranam account with phone OTP or Google to book verified pandits." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const { sendPhoneOtp, verifyPhoneOtp, signInWithGoogle } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (phone.length !== 10) {
      toast.error("Enter a valid 10-digit number");
      return;
    }
    setLoading(true);
    try {
      await sendPhoneOtp(phone);
      setStep("otp");
      toast.success(`OTP sent to +91 ${phone}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await verifyPhoneOtp(phone, code);
      toast.success("Welcome to Pranam 🙏");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  const updateOtp = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <div className="relative h-56 overflow-hidden bg-gradient-warm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        <button
          onClick={() => (step === "otp" ? setStep("phone") : window.history.back())}
          className="absolute left-4 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-background/20 text-primary-foreground backdrop-blur"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative flex h-full flex-col justify-end px-6 pb-6 text-primary-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/20 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold">
            {step === "phone" ? "Welcome to Pranam" : "Verify your number"}
          </h1>
          <p className="mt-1 text-sm opacity-90">
            {step === "phone"
              ? "Book verified pandits, get samagri delivered, talk to astrologers."
              : `We sent a 6-digit code to +91 ${phone}`}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-10">
        {step === "phone" ? (
          <>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phone number
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 shadow-soft">
              <span className="text-sm font-medium text-foreground">🇮🇳 +91</span>
              <div className="h-6 w-px bg-border" />
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="98765 43210"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>

            <Button
              onClick={sendOtp}
              disabled={loading}
              className="mt-5 h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-glow"
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button onClick={handleGoogle} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-card text-sm font-semibold shadow-soft">
              <GoogleIcon /> Continue with Google
            </button>

            <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              By continuing you agree to Pranam's Terms of Service and Privacy Policy. We'll never share your number.
            </p>
          </>
        ) : (
          <>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Enter OTP
            </label>
            <div className="mt-3 flex justify-between gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => updateOtp(i, e.target.value)}
                  className="h-13 w-11 rounded-xl border border-border bg-card text-center text-xl font-bold text-foreground shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              ))}
            </div>

            <Button
              onClick={verifyOtp}
              disabled={loading}
              className="mt-6 h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-glow"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>

            <button
              onClick={sendOtp}
              className="mx-auto mt-4 block text-xs font-medium text-accent"
            >
              Didn't receive code? Resend OTP
            </button>
          </>
        )}

        <div className="mt-10 rounded-2xl border border-border/60 bg-secondary/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">For pandits & astrologers</p>
          <p className="mt-1 text-sm font-medium text-foreground">Are you a spiritual professional?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Apply to join Pranam's verified network and start receiving bookings.</p>
          <Link
            to="/become-pandit"
            className="mt-3 inline-flex items-center text-xs font-semibold text-accent underline-offset-2 hover:underline"
          >
            Apply as a Pandit →
          </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.3 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
