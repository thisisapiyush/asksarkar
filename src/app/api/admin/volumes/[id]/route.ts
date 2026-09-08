import { NextRequest } from "next/server";
import { getDb } from "@/db/index";
import { volumes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  if (!["active", "archived"].includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  await getDb()
    .update(volumes)
    .set({ status })
    .where(eq(volumes.id, id));

  return Response.json({ ok: true });
}
