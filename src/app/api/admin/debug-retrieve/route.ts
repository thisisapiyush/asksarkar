import { NextRequest } from "next/server";
import { normalizeQuery } from "@/lib/normalize";
import { hybridRetrieve } from "@/lib/retrieval";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q?.trim()) {
    return Response.json(
      { error: "Missing query parameter ?q=" },
      { status: 400 }
    );
  }

  const normalized = await normalizeQuery(q);
  const chunks = await hybridRetrieve(normalized.canonical_en, q, 10);

  return Response.json({
    query: q,
    normalized,
    results: chunks.map((c, i) => ({
      rank: i + 1,
      chunkId: c.id,
      volumeId: c.volumeId,
      heading: c.heading,
      titleEn: c.titleEn,
      titleNe: c.titleNe,
      category: c.category,
      contentPreview: c.content.slice(0, 200) + (c.content.length > 200 ? "…" : ""),
      scores: c.scores,
    })),
  });
}
