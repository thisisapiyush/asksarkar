import { NextRequest } from "next/server";
import { getDb } from "@/db/index";
import { conversations, messages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizeQuery } from "@/lib/normalize";
import { hybridRetrieve } from "@/lib/retrieval";
import { getAnthropic } from "@/lib/anthropic";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LANG_RULE: Record<string, string> = {
  en: "Answer in plain, simple English. Short sentences. No jargon.",
  ne: "Answer in Nepali using Devanagari script only (नेपाली). Use everyday spoken Nepali, not heavy legal Nepali. Never write in Roman letters.",
  rom: "Answer in Nepali written with Roman/English letters only — transliteration, not translation. Example style: 'Tapailai nagarikta pramanpatra ko lagi janma darta pramanpatra ra bubako nagarikta ko copy chahincha.' Never use Devanagari script. Keep official document names in Roman Nepali with the English name in brackets the first time.",
};

const MAX_MESSAGES = 40;

const enc = new TextEncoder();
function sse(data: unknown) {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question, lang = "en", sessionId } = body;
  const history: { role: string; content: string }[] = body.history ?? [];

  if (!question?.trim() || !sessionId) {
    return Response.json(
      { error: "Missing question or sessionId" },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const db = getDb();

  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.sessionId, sessionId))
    .limit(1);

  let conv = existing[0];
  if (!conv) {
    const [created] = await db
      .insert(conversations)
      .values({ sessionId, answerLang: lang })
      .returning();
    conv = created;
  }

  const [{ count }] = (await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(eq(messages.conversationId, conv.id))) as [{ count: number }];

  if (count >= MAX_MESSAGES) {
    return Response.json(
      { error: "Session message limit reached" },
      { status: 429 }
    );
  }

  await db.insert(messages).values({
    conversationId: conv.id,
    role: "user",
    content: question,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const normalized = await normalizeQuery(question);
        const chunks = await hybridRetrieve(
          normalized.canonical_en,
          question
        );

        const volumeMap = new Map<
          string,
          { id: string; titleEn: string; titleNe: string }
        >();
        for (const c of chunks) {
          if (!volumeMap.has(c.volumeId)) {
            volumeMap.set(c.volumeId, {
              id: c.volumeId,
              titleEn: c.titleEn,
              titleNe: c.titleNe,
            });
          }
        }
        controller.enqueue(
          sse({
            type: "sources",
            volumes: Array.from(volumeMap.values()),
          })
        );

        const context = chunks.length
          ? chunks
              .map(
                (c) =>
                  `### ${c.titleEn} (${c.titleNe})\nService area: ${c.category}\n${c.content}`
              )
              .join("\n\n---\n\n")
          : "NO MATCHING VOLUME FOUND IN THE DESK.";

        const langRule = LANG_RULE[lang] || LANG_RULE.en;

        const systemPrompt = `You are the front desk of "Ask Sarkar", a public help service for Nepali citizens. A citizen wants to know what to bring before travelling to a government office.

${langRule}

Answer only from the volumes below. Never invent a document, a fee, an office name or a waiting time. If the volumes do not cover the question, say so plainly and tell the person which office to phone — do not guess.

Shape of a good answer:
- One short opening line naming the service and the office.
- A bulleted list headed with what to bring, using "- ".
- Then fee and time, each on its own line.
- If the volumes mention common reasons files get returned, add one short warning line.
Keep the whole answer under 200 words. Do not add greetings or sign-offs. Do not mention "volumes", "context" or "documents provided".

VOLUMES FROM THE DESK:
${context}`;

        const apiMessages = [
          ...history.slice(-6).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content: question },
        ];

        const answerStream = getAnthropic().messages.stream({
          model: "claude-sonnet-5",
          max_tokens: 800,
          system: systemPrompt,
          messages: apiMessages,
        });

        let fullText = "";
        for await (const event of answerStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text;
            controller.enqueue(
              sse({ type: "token", text: event.delta.text })
            );
          }
        }

        await db.insert(messages).values({
          conversationId: conv.id,
          role: "assistant",
          content: fullText,
          retrievedChunkIds: chunks.map((c) => c.id),
        });

        controller.enqueue(sse({ type: "done" }));
        controller.close();
      } catch (e) {
        console.error("Chat stream error:", e);
        controller.enqueue(
          sse({ type: "error", message: "Something went wrong" })
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
