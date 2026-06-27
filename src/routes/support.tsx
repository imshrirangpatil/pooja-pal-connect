import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell, TopBar } from "@/components/MobileShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supportAssistant } from "@/lib/support-chat.functions";
import { toast } from "sonner";
import { Bot, Mail, Send, Loader2, MessageSquarePlus, CheckCircle2, Phone, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_E164, SUPPORT_EMAIL, SUPPORT_HOURS } from "@/lib/support-contact";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Help & Support - Pranam" },
      { name: "description", content: "Get help with bookings, orders, payments and more - chat with our assistant or write to our team." },
    ],
  }),
  component: SupportPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

function SupportPage() {
  const [tab, setTab] = useState<"form" | "chat">("form");
  const { t } = useI18n();

  return (
    <MobileShell>
      <TopBar title={t("support.title")} subtitle={t("support.subtitle")} />
      <div className="px-5 pt-4">
        <div className="flex gap-2 rounded-full border border-border bg-card p-1">
          {(["form", "chat"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold",
                tab === tabKey ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {tabKey === "form" ? <><Mail className="h-3.5 w-3.5" /> {t("support.writeToUs")}</> : <><Bot className="h-3.5 w-3.5" /> {t("support.chatAssistant")}</>}
            </button>
          ))}
        </div>
      </div>
      <p className="px-5 pt-2 text-center text-[11px] text-muted-foreground">
        {t("support.tabsHint")}
      </p>
      {tab === "form" ? <TicketForm /> : <SupportChat />}
    </MobileShell>
  );
}

function TicketForm({ prefill }: { prefill?: { subject?: string; transcript?: ChatMsg[]; message?: string } }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState((user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState(prefill?.subject ?? "");
  const [message, setMessage] = useState(prefill?.message ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => { if (user?.email && !email) setEmail(user.email); }, [user]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error(t("support.errEnterName"));
      return;
    }
    if (!email.trim() || !subject.trim() || !message.trim()) {
      toast.error(t("support.errFields"));
      return;
    }
    setSubmitting(true);
    const { data, error } = await (supabase as any)
      .from("support_tickets")
      .insert({
        user_id: user?.id ?? null,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        source: prefill?.transcript ? "chat" : "form",
        transcript: prefill?.transcript ?? null,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error(t("support.errCreate"));
      return;
    }
    setDone(data.id);
  };

  if (done) {
    return (
      <section className="px-5 pt-6">
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 text-base font-bold">{t("support.ticketCreated")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("support.ticketCreatedSub")} <span className="font-medium">{email}</span></p>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("support.referenceId")}: <span className="font-mono">{done.slice(0, 8)}</span></p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pt-4 pb-8 space-y-3">
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("support.yourName")}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("support.namePlaceholder")} className="mt-1.5" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("support.email")}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("support.subject")}</label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("support.subjectPlaceholder")} className="mt-1.5" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("support.message")}</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("support.messagePlaceholder")}
            rows={6}
            className="mt-1.5"
          />
        </div>
        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1.5 h-4 w-4" /> {t("support.submit")}</>}
        </Button>
      </div>
      <p className="px-1 text-[11px] text-muted-foreground">
        {t("support.preferChat")}
      </p>
    </section>
  );
}

function SupportChat() {
  const { user } = useAuth();
  const { t } = useI18n();
  const GREETING = t("support.greeting", "Namaste 🙏 I'm Pranam Sahayak. How can I help, booking, order, payment, account, anything?");
  const ask = useServerFn(supportAssistant);
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [escalate, setEscalate] = useState<{ subject: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load saved conversation for a signed-in user so it follows them across devices.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("support_chat_messages")
        .select("role, content")
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled || error || !data || data.length === 0) return;
      setMessages([{ role: "assistant", content: GREETING }, ...(data as ChatMsg[])]);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Persist a single message for signed-in users (best effort, non-blocking).
  const persist = (role: ChatMsg["role"], content: string) => {
    if (!user) return;
    void (supabase as any).from("support_chat_messages").insert({ user_id: user.id, role, content });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async () => {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    persist("user", text);
    setPending(true);
    try {
      const res = await ask({ data: { history: next } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      persist("assistant", res.reply);
      if (res.shouldEscalate) {
        setEscalate({ subject: res.suggestedSubject || text.slice(0, 80) });
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: t("support.errorReply", "Sorry, something went wrong. Let's create a ticket so our team can help.") }]);
      setEscalate({ subject: text.slice(0, 80) });
    } finally {
      setPending(false);
    }
  };

  if (showForm && escalate) {
    const transcript = messages;
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    return <TicketForm prefill={{ subject: escalate.subject, transcript, message: lastUser }} />;
  }

  return (
    <section className="px-5 pt-4 pb-6 flex flex-col" style={{ minHeight: "70vh" }}>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-card p-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-secondary px-3 py-2 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("support.thinking")}
            </div>
          </div>
        )}
      </div>

      {escalate && (
        <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Headphones className="h-3.5 w-3.5" /> {t("support.talkToHuman")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("support.talkToHumanSub")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={`tel:${SUPPORT_PHONE_E164}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"
            >
              <Phone className="h-3.5 w-3.5" /> {t("support.callUs")}
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-card px-3 py-2.5 text-xs font-semibold text-primary"
            >
              <Mail className="h-3.5 w-3.5" /> {t("support.emailUs")}
            </a>
          </div>
          <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
            <p><span className="font-medium text-foreground">{SUPPORT_PHONE_DISPLAY}</span> · {SUPPORT_HOURS}</p>
            <p className="font-medium text-foreground">{SUPPORT_EMAIL}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary"
          >
            <MessageSquarePlus className="h-4 w-4" /> {t("support.createTicket")}
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={t("support.typeQuestion")}
          aria-label={t("support.typeQuestion")}
          disabled={pending}
        />
        <Button onClick={send} disabled={pending || !input.trim()} size="icon" aria-label="Send message">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {!user && (
        <p className="mt-2 text-[11px] text-muted-foreground">{t("support.signInTip")}</p>
      )}
    </section>
  );
}
