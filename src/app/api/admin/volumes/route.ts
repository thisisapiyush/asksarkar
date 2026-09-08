import { getDb } from "@/db/index";
import { volumes } from "@/db/schema";
import { sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const vols = await db.select().from(volumes).orderBy(desc(volumes.createdAt));

  const counts = (await db.execute(sql`
    SELECT volume_id, count(*)::int as count FROM chunks GROUP BY volume_id
  `)) as unknown as { volume_id: string; count: number }[];

  const countMap = new Map(counts.map((c) => [c.volume_id, c.count]));

  return Response.json(
    vols.map((v) => ({
      id: v.id,
      titleEn: v.titleEn,
      titleNe: v.titleNe,
      category: v.category,
      status: v.status,
      sourceFilename: v.sourceFilename,
      sampleQuestions: v.sampleQuestions,
      chunkCount: countMap.get(v.id) ?? 0,
      createdAt: v.createdAt,
    }))
  );
}
