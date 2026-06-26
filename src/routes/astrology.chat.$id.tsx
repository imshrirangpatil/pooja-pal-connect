import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, Send, Sparkles, Shield, Star, Loader2, LogIn, Video } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useAstrologers } from "@/lib/astrologers-source";
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
import { ReviewModule } from "@/components/ReviewModule";

export const Route = createFileRoute("/astrology/chat/$id")({
  head: () => ({
    meta: [{ title: "Live chat - Pranam Astrology" }],
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
  const { user } = useAuth();
  const { astrologers } = useAstrologers();
  const astrologer = astrologers.find((a) => a.id === id);
  if (!astrologer) throw notFound();

  const replyFn = useServerFn(generateAstrologerReply);

  // Greet a signed-in seeker by their first name and carry it into the model prompt.
  const userName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || "";
  const firstName = userName.trim().split(/\s+/)[0] || "";
  const astroFirstName = astrologer.name.split(" ").slice(-1)[0];
  const greetingText = firstName
    ? `Namaste ${firstName} 🙏 I'm ${astroFirstName}. Whenever you're ready, share your date, time and place of birth and I'll guide you.`
    : `Namaste 🙏 I'm ${astroFirstName}. Please share your name, date and place of birth so I can guide you.`;

  // UI state - initialised immediately so the interface renders without waiting on backend.
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: "sys-1",
      from: "system",
      text: "Free first 5 minutes • Conversation is end-to-end encrypted on this device",
      at: Date.now(),
    },
    {
      id: "greet-1",
      from: "astrologer",
      text: greetingText,
      at: Date.now(),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [ended, setEnded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number>(Date.now());

  // Backend wiring - populated asynchronously; null means run in local mode.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const keyRef = useRef<CryptoKey | null>(null);
  const [backendReady, setBackendReady] = useState(false);

  // Bootstrap or resume the persisted session - non-blocking.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
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

        keyRef.current = key;
        setSessionId(session.id);
        startedAtRef.current = new Date(session.started_at).getTime();

        if (decrypted.length > 0) {
          setMessages(decrypted);
        } else {
          // Persist the seeded greeting for the brand-new session.
          const sysText = "Free first 5 minutes • Conversation is end-to-end encrypted on this device";
          const greetText = greetingText;
          const sysEnc = await encryptText(key, sysText);
          const grEnc = await encryptText(key, greetText);
          await supabase.from("astro_chat_messages").insert([
            { session_id: session.id, sender: "system", ciphertext: sysEnc.ciphertext, iv: sysEnc.iv },
            { session_id: session.id, sender: "astrologer", ciphertext: grEnc.ciphertext, iv: grEnc.iv },
          ]);
        }
        setBackendReady(true);
      } catch (e) {
        console.error("[astro-chat] backend setup failed", e);
        // Continue without persistence - UI keeps working in local-only mode.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, astrologer.id, astrologer.name, astrologer.pricePerMin]);

  // Timer.
  useEffect(() => {
    if (ended) return;
    const tick = () => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [ended]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const persist = async (from: Msg["from"], text: string) => {
    if (!sessionId || !keyRef.current) return;
    try {
      const { ciphertext, iv } = await encryptText(keyRef.current, text);
      await supabase
        .from("astro_chat_messages")
        .insert({ session_id: sessionId, sender: from, ciphertext, iv });
    } catch (e) {
      console.error("[astro-chat] persist failed", e);
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || typing || ended) return;
    setDraft("");

    const userMsg: Msg = { id: `u-${Date.now()}`, from: "user", text, at: Date.now() };
    setMessages((m) => [...m, userMsg]);
    void persist("user", text);

    setTyping(true);
    try {
      const history = [...messages, userMsg]
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
          userName: userName || undefined,
          history,
        },
      });
      const reply: Msg = {
        id: `a-${Date.now()}`,
        from: "astrologer",
        text: res.reply,
        at: Date.now(),
      };
      setMessages((m) => [...m, reply]);
      void persist("astrologer", reply.text);
    } catch (e) {
      console.error(e);
      toast.error("Astrologer could not reply. Try again.");
    } finally {
      setTyping(false);
    }
  };

  const endSession = async () => {
    if (sessionId) {
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
      toast.success(billed > 0 ? `Session ended. ₹${billed} billed.` : "Session ended.");
    }
    setEnded(true);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const freeLeft = Math.max(0, FREE_SECONDS - seconds);
  const isFree = freeLeft > 0;

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-3">
          <BackButton fallback="/astrology" className="h-8 w-8 bg-transparent hover:bg-muted" />
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
          <Link
            to="/astrology/call/$id"
            params={{ id: astrologer.id }}
            search={{ mode: "video" }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted"
            aria-label="Video call"
          >
            <Video className="h-4 w-4" />
          </Link>
          <Link
            to="/astrology/call/$id"
            params={{ id: astrologer.id }}
            search={{ mode: "audio" }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow"
            aria-label="Voice call"
          >
            <Phone className="h-4 w-4" />
          </Link>
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

      {!user && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          <LogIn className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">Sign in to save this conversation across devices.</span>
          <Link to="/welcome" className="font-semibold underline">
            Sign in
          </Link>
        </div>
      )}
      {user && !backendReady && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          Securing your session…
        </div>
      )}

      {ended && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-card shadow-soft">
            <div className="px-5 pb-3 pt-5 text-center">
              <p className="text-base font-bold">How was your session?</p>
              <p className="mt-1 text-xs text-muted-foreground">Your rating helps the next seeker find the right guide.</p>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <ReviewModule
                targetKind="astrologer"
                targetId={astrologer.id}
                source="astro_chat"
                referenceId={sessionId}
                compact
                onSubmitted={() => setTimeout(() => navigate({ to: "/astrology" }), 800)}
              />
              <button
                onClick={() => navigate({ to: "/astrology" })}
                className="mt-3 w-full rounded-full border border-border bg-card py-2.5 text-xs font-semibold text-muted-foreground"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
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
            aria-label="Type your message"
            disabled={ended || typing}
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
          <button
            onClick={() => void send()}
            disabled={!draft.trim() || typing || ended}
            aria-label="Send message"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-40"
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
