import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";

export const vector768 = customType<{
  data: number[];
  driverData: string;
}>({
  dataType() {
    return "vector(768)";
  },
  fromDriver(value: string): number[] {
    if (typeof value === "string") {
      return value
        .replace(/[\[\]]/g, "")
        .split(",")
        .map(Number);
    }
    return value as unknown as number[];
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
});

export const volumes = pgTable("volumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  titleEn: text("title_en").notNull(),
  titleNe: text("title_ne").notNull(),
  category: text("category").notNull(),
  sourceFilename: text("source_filename"),
  status: text("status").notNull().default("active"),
  sampleQuestions: jsonb("sample_questions").$type<
    { en: string; ne: string; rom: string }[]
  >(),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    volumeId: uuid("volume_id")
      .references(() => volumes.id, { onDelete: "cascade" })
      .notNull(),
    heading: text("heading"),
    content: text("content").notNull(),
    keywordsMultiscript: text("keywords_multiscript").notNull(),
    embedding: vector768("embedding"),
    tokenCount: integer("token_count"),
  },
  (table) => [index("chunks_volume_idx").on(table.volumeId)]
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id").notNull(),
  answerLang: text("answer_lang").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    retrievedChunkIds: jsonb("retrieved_chunk_ids")
      .$type<string[]>()
      .default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("messages_conversation_idx").on(table.conversationId)]
);
