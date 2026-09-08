import { NextRequest } from "next/server";
import { getDb } from "@/db/index";
import { volumes } from "@/db/schema";
import { ingest } from "@/lib/ingest";

export const dynamic = "force-dynamic";

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const text = formData.get("text") as string | null;
  const title = (formData.get("title") as string | null)?.trim() || null;
  const category = (formData.get("category") as string | null)?.trim() || null;

  let rawText: string;
  let filename: string | null = null;

  if (file && file.size > 0) {
    filename = file.name;
    rawText = await extractText(file);
  } else if (text?.trim()) {
    rawText = text.trim();
  } else {
    return Response.json({ error: "No content provided" }, { status: 400 });
  }

  if (rawText.length < 50) {
    return Response.json({ error: "Content too short (< 50 chars)" }, { status: 400 });
  }

  const db = getDb();
  const [vol] = await db
    .insert(volumes)
    .values({
      titleEn: title || "Processing…",
      titleNe: "प्रशोधन हुँदैछ…",
      category: category || "General",
      status: "processing",
      sourceFilename: filename,
    })
    .returning();

  ingest(vol.id, rawText, title, category).catch(console.error);

  return Response.json({ volumeId: vol.id });
}
