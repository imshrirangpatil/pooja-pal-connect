import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Plus, Star, Trash2, Map as MapIcon } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { LocationPicker, type PickedLocation } from "@/components/LocationPicker";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/addresses")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Saved Addresses - Pranam" },
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
  const { t } = useI18n();
  const search = Route.useSearch();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);

  const onPick = (loc: PickedLocation) => {
    setPicked({ lat: loc.lat, lng: loc.lng });
    update({
      ...(loc.line1 ? { line1: loc.line1 } : {}),
      ...(loc.city ? { city: loc.city } : {}),
      ...(loc.state && INDIAN_STATES.includes(loc.state) ? { state: loc.state } : {}),
      ...(loc.pincode ? { pincode: loc.pincode } : {}),
    });
  };

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

  // Auto-fill city and state from a 6-digit pincode via the public India Post API.
  const fillFromPincode = async (pin: string) => {
    if (pin.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();
      const po = json?.[0]?.PostOffice?.[0];
      if (!po) return;
      const matchedState = INDIAN_STATES.find((s) => s.toLowerCase() === String(po.State).toLowerCase());
      update({
        ...(po.District ? { city: po.District } : {}),
        ...(matchedState ? { state: matchedState } : {}),
      });
    } catch {
      /* offline or lookup failed; user can fill manually */
    }
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
      const { error } = await (supabase.from("addresses") as any).insert({
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
        latitude: picked?.lat ?? null,
        longitude: picked?.lng ?? null,
      });
      if (error) throw error;
      // Mirror the chosen location onto the profile so other forms can prefill it.
      if (picked) {
        await (supabase.from("profiles") as any)
          .update({ latitude: picked.lat, longitude: picked.lng, city: parsed.data.city })
          .eq("id", user.id);
      }
      toast.success(t("addr.savedToast"));
      setForm(emptyForm);
      setErrors({});
      setPicked(null);
      setShowMap(false);
      setAdding(false);
      await refresh();
      if (search.redirect) {
        navigate({ to: search.redirect as "/checkout" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("addr.couldNotSave", "Could not save address"));
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
      toast.success(t("addr.defaultUpdated"));
      refresh();
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t("addr.removeConfirm"))) return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast(t("addr.removedToast"));
      refresh();
    }
  };

  return (
    <MobileShell>
      <TopBar
        title={t("addr.title")}
        subtitle={addresses.length ? t("addr.savedCount").replace("{n}", String(addresses.length)) : t("addr.none")}
        right={
          <BackButton
            fallback={(search.redirect as string | undefined) ?? "/profile"}
            className="h-10 w-10 border border-border bg-card"
          />
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
            <p className="mt-2 text-sm font-semibold">{t("addr.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("addr.emptySub")}</p>
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
                        {t("addr.default")}
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
                    <p className="text-[11px] text-muted-foreground">{t("addr.landmarkPrefix")}: {a.landmark}</p>
                  )}
                  <div className="mt-2 flex gap-3">
                    {!a.is_default && (
                      <button
                        onClick={() => setDefault(a.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-accent"
                      >
                        <Star className="h-3 w-3" /> {t("addr.setDefault")}
                      </button>
                    )}
                    <button
                      onClick={() => remove(a.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> {t("common.remove")}
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
            {t("addr.addNew")}
          </button>
        ) : (
          <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="flex w-full items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2.5 text-xs font-semibold text-primary"
            >
              <MapIcon className="h-4 w-4" /> {showMap ? t("addr.hideMap") : t("addr.pickMap")}
            </button>
            {showMap && <LocationPicker value={picked} onChange={onPick} />}
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("addr.label")} error={errors.label}>
                <Input
                  value={form.label}
                  onChange={(e) => update({ label: e.target.value })}
                  placeholder="Home / Work"
                />
              </Field>
              <Field label={t("addr.pincode")} error={errors.pincode}>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    update({ pincode: v });
                    if (v.length === 6) void fillFromPincode(v);
                  }}
                  placeholder="560001"
                />
              </Field>
            </div>
            <Field label={t("addr.recipientName")} error={errors.recipient_name}>
              <Input
                value={form.recipient_name}
                onChange={(e) => update({ recipient_name: e.target.value })}
                placeholder="Full name"
              />
            </Field>
            <Field label={t("addr.phone10")} error={errors.phone}>
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
            <Field label={t("addr.line1")} error={errors.line1}>
              <Input
                value={form.line1}
                onChange={(e) => update({ line1: e.target.value })}
                placeholder="Flat / House / Street"
              />
            </Field>
            <Field label={t("addr.line2")}>
              <Input
                value={form.line2 ?? ""}
                onChange={(e) => update({ line2: e.target.value })}
                placeholder="Area / Locality"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("addr.city")} error={errors.city}>
                <Input
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  placeholder="Bengaluru"
                />
              </Field>
              <Field label={t("addr.state")} error={errors.state}>
                <select
                  value={form.state}
                  onChange={(e) => update({ state: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">{t("addr.selectState")}</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t("addr.landmark")}>
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
              {t("addr.makeDefault")}
            </label>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAdding(false);
                  setForm(emptyForm);
                  setErrors({});
                  setPicked(null);
                  setShowMap(false);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground shadow-glow"
              >
                {saving ? t("addr.saving") : t("addr.save")}
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
