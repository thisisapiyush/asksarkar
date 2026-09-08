import { getDb, getClient } from "./index";
import { sql } from "drizzle-orm";

async function run() {
  const db = getDb();

  const tables = (await db.execute(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  )) as unknown as { tablename: string }[];
  console.log("Existing tables:", tables.map((t) => t.tablename));

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      session_id TEXT NOT NULL,
      answer_lang TEXT NOT NULL DEFAULT 'en',
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )
  `);
  console.log("conversations table ready");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      retrieved_chunk_ids JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )
  `);
  console.log("messages table ready");

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id)`
  );
  console.log("indexes ready");

  await db.execute(
    sql`ALTER TABLE chunks ADD COLUMN IF NOT EXISTS content_hash TEXT`
  );
  console.log("content_hash column ready");

  await getClient().end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
