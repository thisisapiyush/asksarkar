import { NextRequest } from "next/server";
import { getDb } from "@/db/index";
import { volumes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getJobStatus } from "@/lib/ingest";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = getJobStatus(id);
  if (job) return Response.json(job);

  const [vol] = await getDb()
    .select()
    .from(volumes)
    .where(eq(volumes.id, id))
    .limit(1);

  if (!vol) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    volumeId: vol.id,
    stage:
      vol.status === "active"
        ? "complete"
        : vol.status === "error"
          ? "error"
          : "building",
    title: vol.titleEn,
    titleNe: vol.titleNe,
    sampleQuestions: vol.sampleQuestions,
  });
}
