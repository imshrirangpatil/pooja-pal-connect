import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Phone, Send, Sparkles, Shield, Star, Loader2 } from "lucide-react";
import { astrologers } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateAstrologerReply } from "@/lib/astrology-chat.functions";
import {
  decryptText,
  deriveSessionKey,
  encryptText,
  generateSalt,
  getOrCreateUserSecret,
} from "@/lib/chat-crypto";
import { toast } from "sonner";

export const Route = createFileRoute("/astrology/chat/$id")({
  head: () => ({
    meta: [{ title: "Live chat — Pranam Astrology" }],
  }),
  component: ChatPage,
  notFoundComponent: () => (
    <div className="p-6 text-center text-sm text-muted-foreground">Astrologer not found.</div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-6 text-center text-sm text-muted-foreground">
      Something went wrong: {error.message}
    </div>
  ),
});

type Msg = { id: string; from: "user" | "astrologer" | "system"; text: string; at: number };

const FREE_SECONDS = 300;

function ChatPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const astrologer = astrologers.find((a) => a.id === id);
  if (!astrologer) throw notFound();

  const replyFn = useServerFn(generateAstrologerReply);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [keyRef, setKeyRef] = useState<CryptoKey | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [ended, setEnded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number>(Date.now());

  // Redirect to auth if not signed in.
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/welcome" });
  }, [authLoading, user, navigate]);

  // Bootstrap or resume session, derive key, load history.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        // Look for an active session for this user+astrologer.
        const { data: existing } = await supabase
          .from("astro_chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .eq("astrologer_id", astrologer.id)
          .eq("status", "active")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let session = existing;
        if (!session) {
          const salt = generateSalt();
          const { data: created, error } = await supabase
            .from("astro_chat_sessions")
            .insert({
              user_id: user.id,
              astrologer_id: astrologer.id,
              astrologer_name: astrologer.name,
              price_per_min: astrologer.pricePerMin,
              encryption_salt: salt,
            })
            .select("*")
            .single();
          if (error) throw error;
          session = created;
        }
        if (cancelled || !session) return;

        const secret = getOrCreateUserSecret(user.id);
        const key = await deriveSessionKey(secret, session.encryption_salt);
        if (cancelled) return;

        // Load existing messages and decrypt.
        const { data: rows } = await supabase
          .from("astro_chat_messages")
          .select("*")
          .eq("session_id", session.id)
          .order("created_at", { ascending: true });

        const decrypted: Msg[] = await Promise.all(
          (rows ?? []).map(async (r) => ({
            id: r.id,
            from: r.sender as Msg["from"],
            text: await decryptText(key, r.ciphertext, r.iv),
            at: new Date(r.created_at).getTime(),
          })),
        );

        if (cancelled) return;

        setSessionId(session.id);
        setKeyRef(key);
        startedAtRef.current = new Date(session.started_at).getTime();

        // Seed system + greeting on a brand-new session.
        if (decrypted.length === 0) {
          const sysText = "Free first 5 minutes • Conversation is end-to-end encrypted on this device";
          const greetText = `Namaste 🙏 I'm ${astrologer.name.split(" ").slice(-1)[0]}. Please share your name, date and place of birth so I can guide you.`;
          const sysEnc = await encryptText(key, sysText);
          const grEnc = await encryptText(key, greetText);
          const { data: inserted } = await supabase
            .from("astro_chat_messages")
            .insert([
              { session_id: session.id, sender: "system", ciphertext: sysEnc.ciphertext, iv: sysEnc.iv },
              { session_id: session.id, sender: "astrologer", ciphertext: grEnc.ciphertext, iv: grEnc.iv },
            ])
            .select("*");
          const seeded: Msg[] = (inserted ?? []).map((r, i) => ({
            id: r.id,
            from: r.sender as Msg["from"],
            text: i === 0 ? sysText : greetText,
            at: new Date(r.created_at).getTime(),
          }));
          setMessages(seeded);
        } else {
          setMessages(decrypted);
        }
      } catch (e) {
        console.error(e);
        toast.error("Could not start chat. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, astrologer.id, astrologer.name, astrologer.pricePerMin]);

  // Timer derived from session start.
  useEffect(() => {
    if (!sessionId || ended) return;
    const tick = () => {
      const s = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setSeconds(s);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [sessionId, ended]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const persist = async (from: Msg["from"], text: string): Promise<Msg | null> => {
    if (!sessionId || !keyRef) return null;
    const { ciphertext, iv } = await encryptText(keyRef, text);
    const { data, error } = await supabase
      .from("astro_chat_messages")
      .insert({ session_id: sessionId, sender: from, ciphertext, iv })
      .select("*")
      .single();
    if (error || !data) {
      console.error(error);
      return null;
    }
    return { id: data.id, from, text, at: new Date(data.created_at).getTime() };
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !sessionId || !keyRef || typing || ended) return;
    setDraft("");
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, from: "user", text, at: Date.now() }]);
    const saved = await persist("user", text);
    if (saved) setMessages((m) => m.map((x) => (x.id === tempId ? saved : x)));

    setTyping(true);
    try {
      const history = [...messages, { id: tempId, from: "user", text, at: Date.now() }]
        .filter((m) => m.from !== "system")
        .slice(-20)
        .map((m) => ({
          role: m.from === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

      const res = await replyFn({
        data: {
          astrologerName: astrologer.name,
          expertise: astrologer.expertise,
          languages: astrologer.languages,
          history,
        },
      });
      const savedReply = await persist("astrologer", res.reply);
      if (savedReply) setMessages((m) => [...m, savedReply]);
    } catch (e) {
      console.error(e);
      toast.error("Astrologer could not reply. Try again.");
    } finally {
      setTyping(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    const billed =
      seconds > FREE_SECONDS
        ? Math.ceil((seconds - FREE_SECONDS) / 60) * astrologer.pricePerMin
        : 0;
    await supabase
      .from("astro_chat_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        seconds_elapsed: seconds,
        billed_amount: billed,
      })
      .eq("id", sessionId);
    setEnded(true);
    toast.success(billed > 0 ? `Session ended. ₹${billed} billed.` : "Session ended.");
    setTimeout(() => navigate({ to: "/astrology" }), 800);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const freeLeft = Math.max(0, FREE_SECONDS - seconds);
  const isFree = freeLeft > 0;

  const grouped = useMemo(() => messages, [messages]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-md items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-3">
          <Link to="/astrology" className="rounded-full p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-warm text-sm font-bold text-primary-foreground">
              {astrologer.initials}
            </div>
            {astrologer.online && (
              <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{astrologer.name}</h1>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-primary text-primary" /> {astrologer.rating}
              </span>
              <span>•</span>
              <span>{astrologer.expertise}</span>
            </p>
          </div>
          <button
            onClick={endSession}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted"
          >
            End
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-warm text-primary-foreground shadow-glow">
            <Phone className="h-4 w-4" />
          </button>
        </div>
        <div
          className={`flex items-center justify-between px-4 py-1.5 text-[11px] font-medium ${
            isFree ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            {isFree
              ? `Free for ${Math.floor(freeLeft / 60)}:${String(freeLeft % 60).padStart(2, "0")}`
              : `Billing ₹${astrologer.pricePerMin}/min`}
          </span>
          <span className="font-mono">{mm}:{ss}</span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {grouped.map((m) => {
          if (m.from === "system") {
            return (
              <div
                key={m.id}
                className="mx-auto flex max-w-[85%] items-center justify-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-center text-[10.5px] text-muted-foreground"
              >
                <Shield className="h-3 w-3" /> {m.text}
              </div>
            );
          }
          const mine = m.from === "user";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug shadow-soft ${
                  mine
                    ? "rounded-br-md bg-gradient-warm text-primary-foreground"
                    : "rounded-bl-md border border-border/60 bg-card text-foreground"
                }`}
              >
                {m.text}
                <div
                  className={`mt-1 text-[10px] ${
                    mine ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border/60 bg-card px-3.5 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border/60 bg-card/95 px-3 py-2.5 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={ended ? "Session ended" : "Type your question..."}
            disabled={ended || typing}
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
          <button
            onClick={() => void send()}
            disabled={!draft.trim() || typing || ended}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-warm text-primary-foreground shadow-glow disabled:opacity-40"
          >
            {typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <Shield className="h-2.5 w-2.5" /> Messages encrypted on this device (AES-256-GCM)
        </p>
      </div>
    </div>
  );
}
