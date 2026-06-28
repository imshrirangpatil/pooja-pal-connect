import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/lib/auth";
import { useMyPandit } from "@/lib/my-pandit";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, Wallet, Star, MapPin, ShieldCheck, CalendarClock, Loader2, Video } from "lucide-react";
import { INTERVIEW_BOOKING_URL } from "@/lib/partner";
import { meetingLink } from "@/lib/meeting";

export const Route = createFileRoute("/pandit")({
  head: () => ({ meta: [{ title: "Pandit Portal - Pranam" }] }),
  component: PanditPortal,
});

function PanditPortal() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { pandit, loading } = useMyPandit();
  const { t } = useI18n();
  const qc = useQueryClient();
  const photoInput = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState("");
  const [fee, setFee] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/signup" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (pandit) {
      setBio(pandit.bio ?? "");
      setFee(pandit.fee_from ?? 0);
    }
  }, [pandit]);

  const bookingsQ = useQuery({
    queryKey: ["pandit-portal-bookings", pandit?.id],
    enabled: !!pandit,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("id, pooja_name, recipient_name, muhurat, total, status, created_at")
        .eq("pandit_id", pandit!.id)
        .not("pooja_slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; pooja_name: string | null; recipient_name: string; muhurat: string | null; total: number; status: string; created_at: string }>;
    },
  });

  const saveProfile = async () => {
    if (!pandit) return;
    setSaving(true);
    try {
      const { error } = await (supabase.from("pandits") as any)
        .update({ bio: bio.trim() || null, fee_from: fee })
        .eq("id", pandit.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["my-pandit", user?.id] });
      toast.success(t("portal.profileUpdated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file: File | undefined) => {
    if (!file || !pandit || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please pick an image under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const key = `${user.id}/${pandit.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("pandit-photos").upload(key, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("pandit-photos").getPublicUrl(key);
      // Cache-bust so the new photo shows immediately.
      const url = `${pub.publicUrl}?v=${key.length}${file.size}`;
      const { error } = await (supabase.from("pandits") as any).update({ photo_url: url }).eq("id", pandit.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["my-pandit", user.id] });
      toast.success(t("portal.photoUpdated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <MobileShell>
      <TopBar title={t("portal.title")} right={<BackButton fallback="/profile" className="h-10 w-10 border border-border bg-card" />} />

      <div className="px-5 pt-4 pb-10">
        {authLoading || loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-secondary/60" />
        ) : !pandit ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-soft">
            <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">{t("portal.noProfile")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("portal.noProfileSub")}
            </p>
            <Link to="/become-pandit" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow">
              {t("portal.applyCta")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile header */}
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {pandit.photo_url ? (
                    <img src={pandit.photo_url} alt={pandit.name} className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-secondary-foreground">
                      {pandit.initials || pandit.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => photoInput.current?.click()}
                    disabled={uploading}
                    aria-label="Change profile photo"
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={(e) => void uploadPhoto(e.target.files?.[0])} />
                </div>
                <div className="min-w-0">
                  <h2 className="flex items-center gap-1.5 text-lg font-bold">{pandit.name} <ShieldCheck className="h-4 w-4 text-accent" /></h2>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {pandit.city || t("portal.cityNotSet")}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5 font-semibold text-foreground"><Star className="h-3 w-3 fill-primary text-primary" /> {Number(pandit.rating ?? 0).toFixed(1)}</span>
                    <span>({pandit.reviews ?? 0}) · {pandit.experience ?? 0} yrs</span>
                  </div>
                </div>
              </div>
              {pandit.visible === false && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
                  {t("portal.hiddenNote")}
                </p>
              )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/earnings" className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-accent"><Wallet className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-semibold">{t("portal.earnings")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("portal.earningsSub")}</p>
                </div>
              </Link>
              <a href={INTERVIEW_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-accent"><CalendarClock className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-semibold">{t("portal.interview")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("portal.bookSlot")}</p>
                </div>
              </a>
            </div>

            {/* Editable profile */}
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
              <h3 className="text-sm font-bold">{t("portal.yourProfile")}</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("portal.bio")}</label>
                  <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("portal.bioPlaceholder")} className="mt-1" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("portal.startingFee")}</label>
                  <Input type="number" min="0" value={fee || ""} onChange={(e) => setFee(Number(e.target.value))} placeholder="1100" className="mt-1" />
                </div>
                <Button onClick={saveProfile} disabled={saving} className="w-full">{saving ? t("portal.saving") : t("portal.saveProfile")}</Button>
              </div>
            </div>

            {/* Bookings */}
            <div>
              <h3 className="px-1 text-sm font-bold">{t("portal.yourBookings")}</h3>
              {bookingsQ.isLoading ? (
                <div className="mt-2 h-16 animate-pulse rounded-2xl bg-secondary/60" />
              ) : (bookingsQ.data ?? []).length === 0 ? (
                <p className="mt-2 px-1 text-xs text-muted-foreground">{t("portal.noBookings")}</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {(bookingsQ.data ?? []).map((b) => (
                    <div key={b.id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{b.pooja_name ?? "Pooja booking"}</p>
                          <p className="text-[11px] text-muted-foreground">{b.recipient_name} · {b.muhurat || new Date(b.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent">₹{(b.total ?? 0).toLocaleString("en-IN")}</p>
                          <p className="text-[10px] capitalize text-muted-foreground">{b.status}</p>
                        </div>
                      </div>
                      {b.status !== "cancelled" && b.status !== "completed" && b.status !== "delivered" && (
                        <a
                          href={meetingLink(b.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
                        >
                          <Video className="h-3 w-3" /> Join the pooja call
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
