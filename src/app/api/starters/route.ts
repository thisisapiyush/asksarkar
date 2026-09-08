import { getDb } from "@/db/index";
import { volumes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const vols = await getDb()
    .select({ sampleQuestions: volumes.sampleQuestions })
    .from(volumes)
    .where(eq(volumes.status, "active"));

  const questions = vols
    .flatMap((v) => v.sampleQuestions ?? [])
    .filter((q) => q.en && q.ne && q.rom);

  return Response.json(questions);
}
