import { getDb, getClient } from "./index";
import { chunks } from "./schema";
import { sql } from "drizzle-orm";
import { embedDocuments } from "../lib/embed";

async function reembed() {
  const allChunks = await getDb()
    .select({ id: chunks.id, heading: chunks.heading, content: chunks.content })
    .from(chunks);

  if (allChunks.length === 0) {
    console.log("No chunks to re-embed.");
    await getClient().end();
    return;
  }

  console.log(`Re-embedding ${allChunks.length} chunks...`);

  const batchSize = 16;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map(
      (c) => `${c.heading ?? ""}. ${c.content}`
    );
    const embeddings = await embedDocuments(texts);

    for (let j = 0; j < batch.length; j++) {
      await getDb().execute(
        sql`UPDATE chunks SET embedding = ${`[${embeddings[j].join(",")}]`}::vector WHERE id = ${batch[j].id}`
      );
    }

    console.log(`  ${Math.min(i + batchSize, allChunks.length)}/${allChunks.length}`);
  }

  console.log("Done.");
  await getClient().end();
  process.exit(0);
}

reembed().catch((e) => {
  console.error("Re-embed failed:", e);
  process.exit(1);
});
