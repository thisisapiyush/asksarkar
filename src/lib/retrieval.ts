import { getDb } from "@/db/index";
import { sql } from "drizzle-orm";
import { embedQuery } from "./embed";

export interface RetrievedChunk {
  id: string;
  volumeId: string;
  heading: string | null;
  content: string;
  titleEn: string;
  titleNe: string;
  category: string;
  scores: {
    vector: number;
    fts: number;
    trigram: number;
    rrf: number;
  };
}

interface RawRow {
  id: string;
  volume_id: string;
  heading: string | null;
  content: string;
  keywords_multiscript: string;
  title_en: string;
  title_ne: string;
  category: string;
  score: number;
}

const RRF_K = 60;

function buildRanks(rows: RawRow[]): Map<string, { rank: number; row: RawRow }> {
  const map = new Map<string, { rank: number; row: RawRow }>();
  rows.forEach((row, i) => {
    map.set(row.id, { rank: i + 1, row });
  });
  return map;
}

export async function hybridRetrieve(
  canonicalEn: string,
  originalQuery: string,
  topK: number = 5
): Promise<RetrievedChunk[]> {
  const db = getDb();

  const queryEmbedding = await embedQuery(canonicalEn);
  const vecLiteral = `[${queryEmbedding.join(",")}]`;

  const [vectorRows, ftsRows, trigramRows] = await Promise.all([
    db.execute(sql`
      SELECT c.id, c.volume_id, c.heading, c.content, c.keywords_multiscript,
             v.title_en, v.title_ne, v.category,
             1 - (c.embedding <=> ${vecLiteral}::vector) as score
      FROM chunks c
      JOIN volumes v ON c.volume_id = v.id
      WHERE v.status = 'active'
      ORDER BY c.embedding <=> ${vecLiteral}::vector
      LIMIT 20
    `) as unknown as RawRow[],

    db.execute(sql`
      SELECT c.id, c.volume_id, c.heading, c.content, c.keywords_multiscript,
             v.title_en, v.title_ne, v.category,
             ts_rank(to_tsvector('english', c.content),
                     plainto_tsquery('english', ${canonicalEn})) as score
      FROM chunks c
      JOIN volumes v ON c.volume_id = v.id
      WHERE v.status = 'active'
        AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${canonicalEn})
      ORDER BY score DESC
      LIMIT 20
    `) as unknown as RawRow[],

    db.execute(sql`
      SELECT c.id, c.volume_id, c.heading, c.content, c.keywords_multiscript,
             v.title_en, v.title_ne, v.category,
             similarity(c.keywords_multiscript, ${originalQuery}) as score
      FROM chunks c
      JOIN volumes v ON c.volume_id = v.id
      WHERE v.status = 'active'
        AND similarity(c.keywords_multiscript, ${originalQuery}) > 0.05
      ORDER BY score DESC
      LIMIT 20
    `) as unknown as RawRow[],
  ]);

  const vectorRanks = buildRanks(vectorRows);
  const ftsRanks = buildRanks(ftsRows);
  const trigramRanks = buildRanks(trigramRows);

  const allIds = new Set([
    ...vectorRanks.keys(),
    ...ftsRanks.keys(),
    ...trigramRanks.keys(),
  ]);

  const fused: {
    id: string;
    row: RawRow;
    vectorScore: number;
    ftsScore: number;
    trigramScore: number;
    rrfScore: number;
  }[] = [];

  for (const id of allIds) {
    const v = vectorRanks.get(id);
    const f = ftsRanks.get(id);
    const t = trigramRanks.get(id);

    const rrfScore =
      (v ? 1 / (RRF_K + v.rank) : 0) +
      (f ? 1 / (RRF_K + f.rank) : 0) +
      (t ? 1 / (RRF_K + t.rank) : 0);

    const row = v?.row ?? f?.row ?? t?.row;
    if (!row) continue;

    fused.push({
      id,
      row,
      vectorScore: v ? Number(v.row.score) : 0,
      ftsScore: f ? Number(f.row.score) : 0,
      trigramScore: t ? Number(t.row.score) : 0,
      rrfScore,
    });
  }

  fused.sort((a, b) => b.rrfScore - a.rrfScore);

  return fused.slice(0, topK).map((f) => ({
    id: f.id,
    volumeId: f.row.volume_id,
    heading: f.row.heading,
    content: f.row.content,
    titleEn: f.row.title_en,
    titleNe: f.row.title_ne,
    category: f.row.category,
    scores: {
      vector: f.vectorScore,
      fts: f.ftsScore,
      trigram: f.trigramScore,
      rrf: f.rrfScore,
    },
  }));
}

export { type RawRow };
