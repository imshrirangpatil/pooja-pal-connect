import { useEffect, useState } from "react";
import { Star, Loader2, LogIn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  source: string;
  created_at: string;
};

type Props = {
  targetKind: "pandit" | "astrologer";
  targetId: string;
  source?: "profile" | "astro_chat" | "booking";
  referenceId?: string | null;
  /** Hide the historical reviews list (useful for post-session prompts). */
  compact?: boolean;
  onSubmitted?: () => void;
};

export function ReviewModule({ targetKind, targetId, source = "profile", referenceId = null, compact, onSubmitted }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState<ReviewRow | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("reviews")
        .select("id,user_id,rating,comment,source,created_at")
        .eq("target_kind", targetKind)
        .eq("target_id", targetId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows = (data ?? []) as ReviewRow[];
      setReviews(rows);
      const mine = user ? rows.find((r) => r.user_id === user.id && r.source === source) ?? null : null;
      setMyReview(mine);
      if (mine) {
        setRating(mine.rating);
        setComment(mine.comment ?? "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [targetKind, targetId, source, user?.id]);

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in to leave a rating");
      return;
    }
    if (rating < 1) {
      toast.error("Tap a star to rate");
      return;
    }
    setSubmitting(true);
    const payload = {
      user_id: user.id,
      target_kind: targetKind,
      target_id: targetId,
      rating,
      comment: comment.trim() || null,
      source,
      reference_id: referenceId,
    };
    const { data, error } = await supabase
      .from("reviews")
      .upsert(payload, { onConflict: "user_id,target_kind,target_id,source" })
      .select("id,user_id,rating,comment,source,created_at")
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(myReview ? "Rating updated 🙏" : "Thanks for rating 🙏");
    setMyReview(data as ReviewRow);
    setReviews((prev) => {
      const without = prev.filter((r) => r.id !== (data as ReviewRow).id);
      return [data as ReviewRow, ...without];
    });
    onSubmitted?.();
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <div>
            <p className="text-3xl font-bold text-accent">{avg ? avg.toFixed(1) : "—"}</p>
            <div className="mt-0.5 flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(avg) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
              ))}
            </div>
          </div>
          <div className="flex-1 text-xs text-muted-foreground">
            {reviews.length === 0 ? "No ratings yet — be the first." : `${reviews.length} verified rating${reviews.length === 1 ? "" : "s"}`}
          </div>
        </div>
      )}

      {/* Rate form */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <p className="text-sm font-semibold">{myReview ? "Update your rating" : "Rate your experience"}</p>
        {!user ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            <LogIn className="h-3.5 w-3.5" />
            <span className="flex-1">Sign in to leave a rating.</span>
            <Link to="/welcome" className="font-semibold text-primary underline">Sign in</Link>
          </div>
        ) : (
          <>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`Rate ${n} stars`}
                >
                  <Star className={`h-7 w-7 transition-colors ${n <= (hover || rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share a few words (optional)"
              rows={3}
              maxLength={500}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={submit}
              disabled={submitting || rating < 1}
              className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {myReview ? "Update rating" : "Submit rating"}
            </button>
          </>
        )}
      </div>

      {!compact && (
        <div>
          <p className="px-1 pb-2 text-sm font-semibold">All reviews</p>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-xs text-muted-foreground">No reviews yet.</p>
          ) : (
            <ul className="space-y-2">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3 w-3 ${n <= r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                    ))}
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
