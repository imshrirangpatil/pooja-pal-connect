import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Award,
  Users,
  IndianRupee,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/become-pandit")({
  head: () => ({
    meta: [
      { title: "Become a Pandit — Divya" },
      { name: "description", content: "Join Divya's verified network of pandits. Apply, complete KYC and start receiving bookings." },
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

type Step = 0 | 1 | 2 | 3 | 4;

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
    aadhaarUploaded: false,
    credentialUploaded: false,
    selfieUploaded: false,
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
      if (!form.fullName || form.phone.length !== 10 || !form.city) {
        toast.error("Please complete all fields");
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
      if (!form.aadhaarUploaded || !form.credentialUploaded || !form.selfieUploaded) {
        toast.error("Upload all 3 documents to continue");
        return;
      }
      if (!form.agree) {
        toast.error("Please accept the partner agreement");
        return;
      }
      toast.success("Application submitted! Our team will verify within 48 hours.");
      return setStep(4);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={() => (step === 0 ? window.history.back() : setStep((s) => Math.max(0, s - 1) as Step))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Partner application</p>
          <h1 className="text-base font-bold">Become a Divya Pandit</h1>
        </div>
        {step > 0 && step < 4 && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-accent">
            Step {step}/3
          </span>
        )}
      </header>

      {step > 0 && step < 4 && (
        <div className="px-5 pt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-gradient-warm transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
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
                          ? "border-primary bg-gradient-warm text-primary-foreground shadow-glow"
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
            <H2>Verification documents</H2>
            <p className="-mt-2 text-xs text-muted-foreground">
              Your documents are encrypted and reviewed only by our verification team.
            </p>
            <DocUpload
              label="Aadhaar / Government ID"
              hint="Front side, clear photo"
              done={form.aadhaarUploaded}
              onUpload={() => setForm({ ...form, aadhaarUploaded: true })}
            />
            <DocUpload
              label="Credential / Diploma"
              hint="Vidyapeeth certificate or guruji reference letter"
              done={form.credentialUploaded}
              onUpload={() => setForm({ ...form, credentialUploaded: true })}
            />
            <DocUpload
              label="Selfie holding your ID"
              hint="For liveness verification"
              done={form.selfieUploaded}
              onUpload={() => setForm({ ...form, selfieUploaded: true })}
            />

            <label className="mt-3 flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-3">
              <Checkbox
                checked={form.agree}
                onCheckedChange={(c) => setForm({ ...form, agree: c === true })}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-foreground">
                I agree to Divya's <span className="font-semibold text-accent">Partner Agreement</span> and commission terms (15% platform fee per booking). I confirm all information is accurate.
              </span>
            </label>
          </section>
        )}

        {step === 4 && <Success />}
      </div>

      {/* Sticky CTA */}
      {step < 4 && (
        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/95 px-5 py-3 backdrop-blur-xl">
          <Button
            onClick={next}
            className="h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-glow"
          >
            {step === 0 ? "Start application" : step === 3 ? "Submit for verification" : "Continue"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/95 px-5 py-3 backdrop-blur-xl">
          <Button
            onClick={() => navigate({ to: "/" })}
            className="h-12 w-full rounded-full bg-gradient-warm text-base font-semibold shadow-glow"
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
      <div className="overflow-hidden rounded-3xl bg-gradient-warm p-6 text-primary-foreground shadow-glow">
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
          <li>✓ Video interview scheduled via WhatsApp</li>
          <li>✓ Profile goes live · first booking within a week</li>
        </ul>
      </div>
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
  done,
  onUpload,
}: {
  label: string;
  hint: string;
  done: boolean;
  onUpload: () => void;
}) {
  return (
    <button
      onClick={onUpload}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
        done ? "border-primary bg-secondary/60" : "border-dashed border-border bg-card"
      } shadow-soft`}
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
        <p className="text-xs text-muted-foreground">{done ? "Uploaded ✓" : hint}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
