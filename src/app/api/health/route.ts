import { getDb } from "@/db/index";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getDb().execute(sql`SELECT 1 as ok`);
    return NextResponse.json({
      status: "ok",
      db: result.length > 0 ? "connected" : "error",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        error: e instanceof Error ? e.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
