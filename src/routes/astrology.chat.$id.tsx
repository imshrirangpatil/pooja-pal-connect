import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, Send, Sparkles, Shield, Star } from "lucide-react";
import { astrologers } from "@/lib/data";

export const Route = createFileRoute("/astrology/chat/$id")({
  head: () => ({
    meta: [{ title: "Live chat — Pranam Astrology" }],
  }),
  component: ChatPage,
  notFoundComponent: () => (
    <div className="p-6 text-center text-sm text-muted-foreground">Astrologer not found.</div>
  ),
});

type Msg = { id: string; from: "me" | "them" | "system"; text: string; at: number };

const greet = (name: string): Msg[] => [
  {
    id: "sys-1",
    from: "system",
    text: "Free first 5 minutes • Conversation is private & encrypted",
    at: Date.now(),
  },
  {
    id: "m-1",
    from: "them",
    text: `Namaste 🙏 I'm ${name.split(" ").slice(-1)[0]}. Please share your name, date & place of birth to begin.`,
    at: Date.now(),
  },
];

const canned = [
  "Thank you 🙏 Let me check your kundli...",
  "Your Moon sign indicates a strong phase ahead. Saturn is favourable till March.",
  "I'd recommend offering jal to Surya Dev every morning and chanting Gayatri mantra 11 times.",
  "Would you like me to suggest an auspicious muhurat for your next big decision?",
];

function ChatPage() {
  const { id } = Route.useParams();
  const astrologer = astrologers.find((a) => a.id === id);
  if (!astrologer) throw notFound();

  const [messages, setMessages] = useState<Msg[]>(() => greet(astrologer.name));
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const mine: Msg = { id: `me-${Date.now()}`, from: "me", text, at: Date.now() };
    setMessages((m) => [...m, mine]);
    setDraft("");
    setTyping(true);
    const reply = canned[Math.floor(Math.random() * canned.length)];
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: `th-${Date.now()}`, from: "them", text: reply, at: Date.now() },
      ]);
    }, 1200 + Math.random() * 800);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const freeLeft = Math.max(0, 300 - seconds);
  const isFree = freeLeft > 0;

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
        {messages.map((m) => {
          if (m.from === "system") {
            return (
              <div key={m.id} className="mx-auto flex max-w-[85%] items-center justify-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-center text-[10.5px] text-muted-foreground">
                <Shield className="h-3 w-3" /> {m.text}
              </div>
            );
          }
          const mine = m.from === "me";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug shadow-soft ${
                  mine
                    ? "rounded-br-md bg-gradient-warm text-primary-foreground"
                    : "rounded-bl-md bg-card text-foreground border border-border/60"
                }`}
              >
                {m.text}
                <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
                send();
              }
            }}
            placeholder="Type your question..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-warm text-primary-foreground shadow-glow disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
