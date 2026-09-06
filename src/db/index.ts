import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

let _client: Sql | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

export function getClient(): Sql {
  if (!_client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Pass it via .env.local or environment variables."
      );
    }
    _client = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return _client;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}
