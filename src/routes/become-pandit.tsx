import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Award,
  Users,
  IndianRupee,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { INTERVIEW_BOOKING_URL } from "@/lib/partner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { isValidEmail } from "@/lib/utils";

export const Route = createFileRoute("/become-pandit")({
  head: () => ({
    meta: [
      { title: "Become a Pandit - Pranam" },
      { name: "description", content: "Join Pranam's verified network of pandits. Apply, complete KYC and start receiving bookings." },
    ],
  }),
  component: BecomePandit,
});

const SPECIALTIES = [
  "Ganesh Pooja",
  "Satyanarayan Katha",
  "Griha Pravesh",
  "Lakshmi Pooja",
  "Marriage Vidhi",
  "Mundan",
  "Navagraha Shanti",
  "Rudrabhishek",
];
const LANGUAGES = ["Hindi", "Sanskrit", "Marathi", "Gujarati", "Tamil", "Telugu", "Kannada", "Bengali"];

type Step = 0 | 1 | 2 | 3 | 4 | 5;

function BecomePandit() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    yearsExp: "",
    specialties: [] as string[],
    languages: [] as string[],
    bio: "",
    payoutMethod: "upi" as "upi" | "bank",
    upiId: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    aadhaarPath: "",
    credentialPath: "",
    selfiePath: "",
    agree: false,
  });

  const toggle = (key: "specialties" | "languages", value: string) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  };

  const next = () => {
    if (step === 0) return setStep(1);
    if (step === 1) {
      if (!form.fullName.trim()) {
        toast.error("Please enter your full name");
        return;
      }
      if (form.phone.length !== 10) {
        toast.error("Enter a valid 10-digit phone number");
        return;
      }
      if (form.email.trim() && !isValidEmail(form.email)) {
        toast.error("Enter a valid email address, or leave it blank");
        return;
      }
      if (!form.city.trim()) {
        toast.error("Please enter the city you serve");
        return;
      }
      return setStep(2);
    }
    if (step === 2) {
      if (form.specialties.length === 0 || form.languages.length === 0) {
        toast.error("Pick at least one specialty and language");
        return;
      }
      return setStep(3);
    }
    if (step === 3) {
      if (form.payoutMethod === "upi") {
        if (!form.upiId.includes("@")) {
          toast.error("Enter a valid UPI ID (e.g. name@okhdfc)");
          return;
        }
      } else {
        if (!form.accountHolder || form.accountNumber.length < 8 || form.ifsc.length !== 11) {
          toast.error("Please complete all bank fields (IFSC must be 11 chars)");
          return;
        }
      }
      return setStep(4);
    }
    if (step === 4) {
      if (!form.aadhaarPath || !form.credentialPath || !form.selfiePath) {
        toast.error("Upload all 3 documents to continue");
        return;
      }
      if (!form.agree) {
        toast.error("Please accept the partner agreement");
        return;
      }
      void (async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("pandit_applications").insert({
          user_id: user?.id ?? null,
          full_name: form.fullName,
          phone: form.phone,
          city: form.city,
          experience: Number(form.yearsExp) || 0,
          languages: form.languages.join(", "),
          specialties: form.specialties.join(", "),
          message: form.bio || null,
          upi_id: form.payoutMethod === "upi" ? form.upiId.trim() : null,
          account_holder: form.payoutMethod === "bank" ? form.accountHolder.trim() : null,
          account_number: form.payoutMethod === "bank" ? form.accountNumber.trim() : null,
          ifsc: form.payoutMethod === "bank" ? form.ifsc.trim().toUpperCase() : null,
          bank_name: form.payoutMethod === "bank" ? form.bankName.trim() : null,
          aadhaar_url: form.aadhaarPath,
          credential_url: form.credentialPath,
          selfie_url: form.selfiePath,
        } as never);
        if (error) toast.error(error.message);
        else toast.success("Application submitted! Our team will verify within 48 hours.");
      })();
      return setStep(5);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={() => {
            if (step !== 0) {
              setStep((s) => Math.max(0, s - 1) as Step);
              return;
            }
            if (window.history.length > 1) window.history.back();
            else navigate({ to: "/" });
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Partner application</p>
          <h1 className="text-base font-bold">Become a Pranam Pandit</h1>
        </div>
        {step > 0 && step < 5 && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-accent">
            Step {step}/4
          </span>
        )}
      </header>

      {step > 0 && step < 5 && (
        <div className="px-5 pt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-gradient-warm transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 px-5 pb-28 pt-5">
        {step === 0 && <Intro />}
        {step === 1 && (
          <section className="space-y-4">
            <H2>Personal details</H2>
            <Field label="Full name (as per ID)">
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Pandit Ramesh Sharma" />
            </Field>
            <Field label="Phone number">
              <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3">
                <span className="text-sm font-medium">+91</span>
                <div className="h-5 w-px bg-border" />
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="98765 43210"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </div>
            </Field>
            <Field label="Email (optional)">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ramesh@example.com" />
            </Field>
            <Field label="City you serve">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" />
            </Field>
            <Field label="Years of experience">
              <Input type="number" min="0" value={form.yearsExp} onChange={(e) => setForm({ ...form, yearsExp: e.target.value })} placeholder="12" />
            </Field>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <H2>Your expertise</H2>
            <div>
              <Label>Specialties (poojas you perform)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const on = form.specialties.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggle("specialties", s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        on
                          ? "border-primary bg-primary text-primary-foreground shadow-glow"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Languages spoken</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGES.map((s) => {
                  const on = form.languages.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggle("languages", s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Short bio (shown on your profile)">
              <Textarea
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Trained at Kashi Sanskrit Vidyapeeth. 12+ years performing Vedic rituals across Maharashtra…"
              />
            </Field>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <H2>How you get paid</H2>
            <p className="-mt-2 text-xs text-muted-foreground">
              Your sewa reaches your UPI or bank account soon after every completed booking.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["upi", "bank"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, payoutMethod: m })}
                  className={`rounded-2xl border p-3 text-left text-sm font-semibold transition ${
                    form.payoutMethod === m
                      ? "border-primary bg-secondary/60 text-foreground shadow-glow"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {m === "upi" ? "UPI ID" : "Bank account"}
                  <p className="mt-0.5 text-[10px] font-normal text-muted-foreground">
                    {m === "upi" ? "Instant · zero fee" : "NEFT/IMPS · same-day"}
                  </p>
                </button>
              ))}
            </div>

            {form.payoutMethod === "upi" ? (
              <Field label="UPI ID">
                <Input
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  placeholder="ramesh@okhdfc"
                  autoCapitalize="off"
                />
              </Field>
            ) : (
              <>
                <Field label="Account holder name">
                  <Input value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="Ramesh Sharma" />
                </Field>
                <Field label="Account number">
                  <Input
                    inputMode="numeric"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "") })}
                    placeholder="1234567890"
                  />
                </Field>
                <Field label="IFSC code">
                  <Input
                    value={form.ifsc}
                    onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase().slice(0, 11) })}
                    placeholder="HDFC0001234"
                  />
                </Field>
                <Field label="Bank name (optional)">
                  <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="HDFC Bank" />
                </Field>
              </>
            )}
            <p className="rounded-xl bg-secondary/40 p-3 text-[11px] text-muted-foreground">
              🔒 Your payout details are encrypted and visible only to our finance team.
            </p>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <H2>Let's verify you</H2>
            <p className="-mt-2 text-xs text-muted-foreground">
              Your documents are encrypted and seen only by our verification team.
            </p>
            <DocUpload
              label="Aadhaar / Government ID"
              hint="Front side, clear photo"
              field="aadhaar"
              path={form.aadhaarPath}
              onUploaded={(p) => setForm((f) => ({ ...f, aadhaarPath: p }))}
            />
            <DocUpload
              label="Credential / Diploma"
              hint="Vidyapeeth certificate or guruji reference letter"
              field="credential"
              path={form.credentialPath}
              onUploaded={(p) => setForm((f) => ({ ...f, credentialPath: p }))}
            />
            <DocUpload
              label="Selfie holding your ID"
              hint="For liveness verification"
              field="selfie"
              path={form.selfiePath}
              onUploaded={(p) => setForm((f) => ({ ...f, selfiePath: p }))}
            />

            <label className="mt-3 flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-3">
              <Checkbox
                checked={form.agree}
                onCheckedChange={(c) => setForm({ ...form, agree: c === true })}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-foreground">
                I agree to Pranam's <span className="font-semibold text-accent">Partner Agreement</span> and commission terms (15% platform fee per booking). I confirm all information is accurate.
              </span>
            </label>
          </section>
        )}

        {step === 5 && <Success />}
      </div>

      {/* Sticky CTA */}
      {step < 5 && (
        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/95 px-5 py-3 backdrop-blur-xl">
          <Button
            onClick={next}
            className="h-12 w-full rounded-full bg-primary text-base font-semibold shadow-glow"
          >
            {step === 0 ? "Start application" : step === 4 ? "Submit for verification" : "Continue"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 5 && (
        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/95 px-5 py-3 backdrop-blur-xl">
          <Button
            onClick={() => navigate({ to: "/" })}
            className="h-12 w-full rounded-full bg-primary text-base font-semibold shadow-glow"
          >
            Back to home
          </Button>
        </div>
      )}
    </div>
  );
}

function Intro() {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl bg-secondary p-6 text-secondary-foreground shadow-glow">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/20 backdrop-blur">
          <Award className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold leading-tight">
          Grow your sewa with India's most trusted pooja platform
        </h2>
        <p className="mt-2 text-sm opacity-90">
          Receive bookings from devotees across your city. Get paid securely after every ritual.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={<Users className="h-4 w-4" />} k="50k+" v="Devotees" />
        <Stat icon={<IndianRupee className="h-4 w-4" />} k="₹35k" v="Avg/mo" />
        <Stat icon={<ShieldCheck className="h-4 w-4" />} k="100%" v="Secure" />
      </div>

      <div>
        <h3 className="font-display text-base font-bold">How verification works</h3>
        <ol className="mt-3 space-y-3">
          {[
            { t: "Apply online", d: "Fill basic details and your specialties (2 min)" },
            { t: "Upload documents", d: "ID, credentials and selfie for KYC" },
            { t: "Video interview", d: "15-min call with our verification team" },
            { t: "Go live", d: "Start receiving bookings within 48 hours" },
          ].map((s, i) => (
            <li key={s.t} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-warm text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{s.t}</p>
                <p className="text-xs text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Already a partner?{" "}
        <Link to="/signup" className="font-semibold text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Success() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-warm shadow-glow">
        <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">Application received 🙏</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Our team will verify your documents and reach out within <span className="font-semibold text-foreground">48 hours</span> to schedule your video interview.
      </p>
      <div className="mt-6 w-full space-y-2 rounded-2xl border border-border/60 bg-secondary/40 p-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">What's next</p>
        <ul className="space-y-1.5 text-xs text-foreground">
          <li>✓ KYC review (~24h)</li>
          <li>✓ Credential check with your Vidyapeeth</li>
          <li>✓ Video interview, pick a slot below</li>
          <li>✓ Profile goes live · first booking within a week</li>
        </ul>
      </div>

      <a
        href={INTERVIEW_BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-card py-3 text-sm font-semibold text-primary"
      >
        <CalendarClock className="h-4 w-4" /> Book your interview slot
      </a>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-lg font-bold">{children}</h2>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Stat({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 text-center shadow-soft">
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-accent">
        {icon}
      </div>
      <p className="mt-1 text-sm font-bold">{k}</p>
      <p className="text-[10px] text-muted-foreground">{v}</p>
    </div>
  );
}
function DocUpload({
  label,
  hint,
  field,
  path,
  onUploaded,
}: {
  label: string;
  hint: string;
  field: string;
  path: string;
  onUploaded: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const done = !!path;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Please pick a file under 8 MB");
      return;
    }
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop() || "jpg";
      const folder = user?.id ?? "anon";
      const key = `${folder}/${field}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("pandit-docs").upload(key, file, { upsert: true });
      if (error) throw error;
      onUploaded(key);
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed, please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
          done ? "border-primary bg-secondary/60" : "border-dashed border-border bg-card"
        } shadow-soft disabled:opacity-60`}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            done ? "bg-gradient-warm text-primary-foreground" : "bg-secondary text-accent"
          }`}
        >
          {done ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{busy ? "Uploading…" : done ? "Uploaded, tap to replace" : hint}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </>
  );
}
