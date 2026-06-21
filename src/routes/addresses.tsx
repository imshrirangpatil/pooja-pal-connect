import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/addresses")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Saved Addresses — Pranam" },
      { name: "description", content: "Manage your delivery addresses." },
    ],
  }),
  component: AddressesPage,
});

type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const formSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40),
  recipient_name: z.string().trim().min(2, "Name is required").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(3, "House / street required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City required").max(80),
  state: z.string().trim().min(2, "Please select a state"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  landmark: z.string().trim().max(120).optional().or(z.literal("")),
  is_default: z.boolean().default(false),
});

type FormState = z.infer<typeof formSchema>;
const emptyForm: FormState = {
  label: "Home",
  recipient_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  is_default: false,
};

function AddressesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const search = Route.useSearch();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setAddresses(data ?? []);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/signup" });
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [authLoading, user, navigate]);

  const update = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k as keyof FormState]);
      return next;
    });
  };

  const save = async () => {
    if (!user) return;
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof FormState;
        if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSaving(true);
    try {
      const isFirst = addresses.length === 0;
      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        label: parsed.data.label,
        recipient_name: parsed.data.recipient_name,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
        landmark: parsed.data.landmark || null,
        is_default: parsed.data.is_default || isFirst,
      });
      if (error) throw error;
      toast.success("Address saved");
      setForm(emptyForm);
      setErrors({});
      setAdding(false);
      await refresh();
      if (search.redirect) {
        navigate({ to: search.redirect as "/checkout" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Default updated");
      refresh();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this address?")) return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast("Address removed");
      refresh();
    }
  };

  return (
    <MobileShell>
      <TopBar
        title="Saved Addresses"
        subtitle={addresses.length ? `${addresses.length} saved` : "None yet"}
        right={
          <Link
            to={search.redirect ? (search.redirect as "/checkout") : "/profile"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <div className="px-5 pt-4 pb-10">
        {loading ? (
          <div className="space-y-2">
            <div className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
            <div className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
          </div>
        ) : addresses.length === 0 && !adding ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-soft">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">No addresses yet</p>
            <p className="text-xs text-muted-foreground">Add one to get pooja samagri delivered.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3.5 shadow-soft"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{a.label}</span>
                    {a.is_default && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.recipient_name} · +91 {a.phone}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/80">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                  </p>
                  {a.landmark && (
                    <p className="text-[11px] text-muted-foreground">Landmark: {a.landmark}</p>
                  )}
                  <div className="mt-2 flex gap-3">
                    {!a.is_default && (
                      <button
                        onClick={() => setDefault(a.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-accent"
                      >
                        <Star className="h-3 w-3" /> Set default
                      </button>
                    )}
                    <button
                      onClick={() => remove(a.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4 text-sm font-semibold shadow-soft"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-accent">
              <Plus className="h-4 w-4" />
            </span>
            Add new address
          </button>
        ) : (
          <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Label" error={errors.label}>
                <Input
                  value={form.label}
                  onChange={(e) => update({ label: e.target.value })}
                  placeholder="Home / Work"
                />
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, "") })}
                  placeholder="560001"
                />
              </Field>
            </div>
            <Field label="Recipient name" error={errors.recipient_name}>
              <Input
                value={form.recipient_name}
                onChange={(e) => update({ recipient_name: e.target.value })}
                placeholder="Full name"
              />
            </Field>
            <Field label="Phone (10 digits)" error={errors.phone}>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  className="rounded-l-none"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="9876543210"
                />
              </div>
            </Field>
            <Field label="Address line 1" error={errors.line1}>
              <Input
                value={form.line1}
                onChange={(e) => update({ line1: e.target.value })}
                placeholder="Flat / House / Street"
              />
            </Field>
            <Field label="Address line 2 (optional)">
              <Input
                value={form.line2 ?? ""}
                onChange={(e) => update({ line2: e.target.value })}
                placeholder="Area / Locality"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="City" error={errors.city}>
                <Input
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  placeholder="Bengaluru"
                />
              </Field>
              <Field label="State" error={errors.state}>
                <select
                  value={form.state}
                  onChange={(e) => update({ state: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Landmark (optional)">
              <Input
                value={form.landmark ?? ""}
                onChange={(e) => update({ landmark: e.target.value })}
                placeholder="Near temple, etc."
              />
            </Field>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => update({ is_default: e.target.checked })}
              />
              Make this my default address
            </label>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAdding(false);
                  setForm(emptyForm);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground shadow-glow"
              >
                {saving ? "Saving…" : "Save address"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
