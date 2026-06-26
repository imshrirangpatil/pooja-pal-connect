import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Support assistant - uses Lovable AI Gateway. Returns a reply plus
// a `shouldEscalate` flag the UI uses to offer ticket creation.

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  history: z.array(MessageSchema).min(1).max(30),
});

type Reply = { reply: string; shouldEscalate: boolean; suggestedSubject?: string };

const SYSTEM_PROMPT = `You are "Pranam Sahayak", the friendly customer-support assistant for Pranam - an Indian app for booking poojas, ordering samagri, talking to astrologers, and viewing festivals/muhurat.

Answer ONLY common, factual support questions confidently:
- Booking / rescheduling / cancelling a pooja
- Order tracking, delivery, samagri kit contents
- Wallet, refunds, payment methods, credits, referrals
- Pandit profiles, languages, ratings
- Becoming a pandit on the platform
- Festivals & choghadiya in the app
- Account / login / phone or Google auth issues
- App bugs the user can self-fix (clear cache, update app, retry)

If a question is:
- The user directly asks to talk to a human, an agent, or a real person
- Specific to ONE user's order/account/payment status
- A complaint requiring a human (refund disputes, pandit complaint, billing dispute)
- Outside the app's scope (general life advice, legal advice, medical, etc.)
- Something you genuinely cannot answer with confidence
DO NOT guess. Warmly confirm that a human from the team will help, tell them they can call or email support or raise a ticket right here, and set escalate=true.

Reply rules:
- 1-3 short sentences. Friendly, in Hinglish or English (mirror the user).
- Never invent order IDs, refund amounts, or policies you don't know.
- End your VERY LAST line with a JSON tag on its own line:
  <META>{"escalate": true|false, "subject": "short ticket subject if escalating, else empty"}</META>
- The <META> line is mandatory in every reply.`;

export const supportAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<Reply> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        reply: "Our assistant is briefly offline. Please use the form to reach our support team.",
        shouldEscalate: true,
      };
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.history],
        }),
      });

      if (res.status === 429) {
        return { reply: "Many people are reaching out right now - please retry in a few seconds.", shouldEscalate: false };
      }
      if (res.status === 402) {
        return { reply: "Our assistant is paused. A human will help - let's create a ticket.", shouldEscalate: true };
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("[support-chat] gateway error", res.status, t);
        return { reply: "Something went wrong. Let's create a ticket so our team can help.", shouldEscalate: true };
      }

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = json.choices?.[0]?.message?.content?.trim() ?? "";

      // Parse <META> tag
      const metaMatch = raw.match(/<META>([\s\S]*?)<\/META>\s*$/);
      let escalate = false;
      let subject = "";
      let body = raw;
      if (metaMatch) {
        body = raw.slice(0, metaMatch.index).trim();
        try {
          const meta = JSON.parse(metaMatch[1]) as { escalate?: boolean; subject?: string };
          escalate = !!meta.escalate;
          subject = (meta.subject ?? "").trim();
        } catch {
          /* ignore parse errors */
        }
      }

      return {
        reply: body || "Could you share a bit more so I can help?",
        shouldEscalate: escalate,
        suggestedSubject: subject || undefined,
      };
    } catch (err) {
      console.error("[support-chat] error", err);
      return { reply: "Connection hiccup - let's create a ticket so our team can follow up.", shouldEscalate: true };
    }
  });
