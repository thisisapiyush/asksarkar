import { getDb } from "@/db/index";
import { volumes } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { getAnthropic } from "./anthropic";
import { embedDocuments } from "./embed";
import crypto from "crypto";

export interface IngestJob {
  volumeId: string;
  stage: "extracting" | "building" | "complete" | "error";
  error?: string;
  title?: string;
  titleNe?: string;
  sampleQuestions?: { en: string; ne: string; rom: string }[];
  chunkCount?: number;
}

const jobs = new Map<string, IngestJob>();

export function getJobStatus(volumeId: string): IngestJob | undefined {
  return jobs.get(volumeId);
}

/* ── Chunking ─────────────────────────────────────────────── */

interface RawChunk {
  heading: string | null;
  content: string;
}

function tokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function isList(line: string): boolean {
  return /^\s*[-•*]\s/.test(line) || /^\s*\d+[.)]\s/.test(line);
}

export function structuralChunk(text: string): RawChunk[] {
  const MIN = 400;
  const MAX = 800;
  const blocks = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

  const chunks: RawChunk[] = [];
  let heading: string | null = null;
  let buf: string[] = [];
  let bufTok = 0;

  function flush() {
    if (buf.length) {
      chunks.push({ heading, content: buf.join("\n\n") });
      buf = [];
      bufTok = 0;
    }
  }

  for (const block of blocks) {
    const t = tokens(block);
    const lines = block.split("\n");
    const first = lines[0].trim();

    const isShort = block.length < 100 && lines.length === 1;
    const looksHeading =
      isShort &&
      !isList(first) &&
      (/^[A-Z]/.test(first) || first.endsWith(":") || first.startsWith("#"));

    if (looksHeading && t < 30) {
      if (bufTok >= MIN) flush();
      heading = first.replace(/^#+\s*/, "").replace(/^\*\*|\*\*$/g, "");
      continue;
    }

    const hasListItems = lines.some((l) => isList(l));

    if (bufTok + t > MAX && buf.length > 0) flush();

    if (t > MAX && !hasListItems) {
      flush();
      const sentences = block.split(/(?<=\.)\s+/);
      let sub: string[] = [];
      let subTok = 0;
      for (const s of sentences) {
        const st = tokens(s);
        if (subTok + st > MAX && sub.length) {
          chunks.push({ heading, content: sub.join(" ") });
          sub = [];
          subTok = 0;
        }
        sub.push(s);
        subTok += st;
      }
      if (sub.length) {
        buf = [sub.join(" ")];
        bufTok = subTok;
      }
      continue;
    }

    buf.push(block);
    bufTok += t;
  }

  flush();
  return chunks.length ? chunks : [{ heading: null, content: text.trim() }];
}

/* ── Metadata via Haiku ───────────────────────────────────── */

async function generateMetadata(
  text: string,
  providedTitle?: string | null,
  providedCategory?: string | null
) {
  const response = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: `You generate metadata for Nepali government service documents.
Return ONLY a JSON object (no markdown fences):
{"title_en":"English title","title_ne":"Nepali Devanagari title","category":"Identity|Travel|Transport|Vital events|Tax|Land|Welfare|Education|Health|General","sample_questions":[{"en":"...","ne":"...","rom":"..."},{"en":"...","ne":"...","rom":"..."},{"en":"...","ne":"...","rom":"..."}]}
${providedTitle ? `Suggested title: "${providedTitle}".` : ""}
${providedCategory ? `Suggested category: "${providedCategory}".` : ""}`,
    messages: [{ role: "user", content: text.slice(0, 4000) }],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  return {
    titleEn: parsed.title_en || providedTitle || "Untitled",
    titleNe: parsed.title_ne || "शीर्षकविहीन",
    category: parsed.category || providedCategory || "General",
    sampleQuestions: (parsed.sample_questions || []) as {
      en: string;
      ne: string;
      rom: string;
    }[],
  };
}

/* ── Keywords via Haiku (batched) ─────────────────────────── */

async function generateKeywordsBatch(
  chunkList: RawChunk[]
): Promise<string[]> {
  const BATCH = 5;
  const all: string[] = [];

  for (let i = 0; i < chunkList.length; i += BATCH) {
    const batch = chunkList.slice(i, i + BATCH);
    const prompt = batch
      .map((c, j) => `Chunk ${j + 1}:\n${c.content.slice(0, 1200)}`)
      .join("\n\n---\n\n");

    try {
      const response = await getAnthropic().messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: `Generate multi-script keywords for Nepali government service document chunks.
Per chunk produce 15-20 space-separated keywords: 5-7 English, 5-7 Devanagari, 5-7 Roman Nepali.
Return ONLY a JSON array of strings, one per chunk. No markdown fences.`,
        messages: [{ role: "user", content: prompt }],
      });

      const raw =
        response.content[0].type === "text" ? response.content[0].text : "[]";
      const parsed = JSON.parse(
        raw.replace(/```json|```/g, "").trim()
      ) as string[];
      all.push(...parsed);
    } catch {
      all.push(...batch.map(() => ""));
    }
  }

  return all;
}

/* ── Main pipeline ────────────────────────────────────────── */

export async function ingest(
  volumeId: string,
  rawText: string,
  providedTitle?: string | null,
  providedCategory?: string | null
) {
  const job: IngestJob = { volumeId, stage: "extracting" };
  jobs.set(volumeId, job);
  const db = getDb();

  try {
    await db.execute(
      sql`ALTER TABLE chunks ADD COLUMN IF NOT EXISTS content_hash TEXT`
    );

    job.stage = "building";
    const newChunks = structuralChunk(rawText);

    const meta = await generateMetadata(rawText, providedTitle, providedCategory);
    await db
      .update(volumes)
      .set({
        titleEn: meta.titleEn,
        titleNe: meta.titleNe,
        category: meta.category,
        sampleQuestions: meta.sampleQuestions,
      })
      .where(eq(volumes.id, volumeId));

    job.title = meta.titleEn;
    job.titleNe = meta.titleNe;
    job.sampleQuestions = meta.sampleQuestions;

    const keywords = await generateKeywordsBatch(newChunks);

    const hashes = newChunks.map((c) =>
      crypto.createHash("sha256").update(c.content).digest("hex")
    );

    const existingRows = (await db.execute(sql`
      SELECT content_hash, embedding
      FROM chunks
      WHERE volume_id = ${volumeId}
        AND content_hash IS NOT NULL
        AND embedding IS NOT NULL
    `)) as unknown as { content_hash: string; embedding: string }[];

    const reuseMap = new Map<string, number[]>();
    for (const row of existingRows) {
      if (row.content_hash && row.embedding) {
        reuseMap.set(
          row.content_hash,
          typeof row.embedding === "string"
            ? row.embedding.replace(/[\[\]]/g, "").split(",").map(Number)
            : (row.embedding as unknown as number[])
        );
      }
    }

    const toEmbed: { idx: number; text: string }[] = [];
    const reused = new Map<number, number[]>();

    for (let i = 0; i < newChunks.length; i++) {
      const cached = reuseMap.get(hashes[i]);
      if (cached) {
        reused.set(i, cached);
      } else {
        toEmbed.push({
          idx: i,
          text: `${meta.titleEn}. ${meta.category}. ${newChunks[i].heading ? newChunks[i].heading + ". " : ""}${newChunks[i].content}`,
        });
      }
    }

    let fresh: number[][] = [];
    if (toEmbed.length) {
      fresh = await embedDocuments(toEmbed.map((t) => t.text));
    }

    await db.execute(sql`DELETE FROM chunks WHERE volume_id = ${volumeId}`);

    let freshIdx = 0;
    for (let i = 0; i < newChunks.length; i++) {
      const embedding = reused.has(i)
        ? reused.get(i)!
        : fresh[freshIdx++];

      await db.execute(sql`
        INSERT INTO chunks (volume_id, heading, content, keywords_multiscript, embedding, token_count, content_hash)
        VALUES (
          ${volumeId},
          ${newChunks[i].heading},
          ${newChunks[i].content},
          ${keywords[i] || ""},
          ${`[${embedding.join(",")}]`}::vector,
          ${Math.ceil(newChunks[i].content.length / 4)},
          ${hashes[i]}
        )
      `);
    }

    await db
      .update(volumes)
      .set({ status: "active" })
      .where(eq(volumes.id, volumeId));

    job.stage = "complete";
    job.chunkCount = newChunks.length;
  } catch (e: unknown) {
    console.error("Ingest error:", e);
    job.stage = "error";
    job.error = e instanceof Error ? e.message : String(e);
    await db
      .update(volumes)
      .set({ status: "error" })
      .where(eq(volumes.id, volumeId))
      .catch(() => {});
  }
}
