import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Generates an astrologer reply via Lovable AI Gateway. The handler receives
// plaintext message history, returns plaintext reply. The client encrypts both
// before persisting - the database only ever sees ciphertext.

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  astrologerName: z.string().min(1).max(120),
  expertise: z.string().min(1).max(120),
  languages: z.array(z.string()).max(8),
  userName: z.string().max(120).optional(),
  history: z.array(MessageSchema).max(40),
});

export const generateAstrologerReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "🙏 (Astrologer is briefly offline. Please try again in a moment.)" };
    }

    const userLine = data.userName
      ? `- The seeker's name is ${data.userName}. Greet them warmly by name and remember it for the whole conversation.`
      : `- Ask the seeker's name early and remember it for the whole conversation.`;

    const system = `You are ${data.astrologerName}, a warm, respectful Indian astrologer specialising in ${data.expertise}.
${userLine}
- Reply in the SAME language the seeker writes in. If they write in English, reply in English. If they write in Hindi, reply in Hindi. Never switch the language on the seeker.
- Keep replies short (2 to 4 sentences) and conversational, like a live chat.
- Use Vedic terminology naturally: rashi, nakshatra, dasha, graha, muhurat, mantra, upay.
- If the seeker has not shared their date, time, or place of birth, ask gently for the missing pieces before giving predictions.
- Offer one practical, traditional remedy (mantra, daan, vrat, or puja) when relevant.
- Never claim to predict death or accidents, and never guarantee outcomes. Encourage shraddha (faith) and effort.
- Begin your very first message with "Namaste 🙏" only if the conversation has just started.
- Do not mention you are an AI. Stay in character as ${data.astrologerName}.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...data.history],
        }),
      });

      if (res.status === 429) {
        return { reply: "🙏 Many seekers are connecting right now - please try again in a few seconds." };
      }
      if (res.status === 402) {
        return { reply: "🙏 The astrology line is temporarily paused. Please try again later." };
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("[astrology-chat] gateway error", res.status, t);
        return { reply: "🙏 I lost the connection for a moment. Could you repeat that?" };
      }

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const reply = json.choices?.[0]?.message?.content?.trim();
      return { reply: reply || "🙏 Please share a bit more so I can guide you correctly." };
    } catch (err) {
      console.error("[astrology-chat] error", err);
      return { reply: "🙏 Connection hiccup - please send your question again." };
    }
  });
