import { sql } from "drizzle-orm";
import { db } from "./db";

export async function runMigrations(): Promise<void> {
  if (!db) throw new Error("PostgreSQL is unavailable.");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trading_state (
      scope varchar NOT NULL,
      key varchar NOT NULL,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (scope, key)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS budget_state (
      user_id varchar NOT NULL,
      kind varchar NOT NULL,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, kind)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS capital_migration_batches (
      id varchar PRIMARY KEY,
      source_repository varchar NOT NULL,
      source_commit varchar NOT NULL,
      schema_version varchar NOT NULL,
      started_at timestamptz NOT NULL,
      completed_at timestamptz,
      actor varchar NOT NULL,
      counts jsonb NOT NULL DEFAULT '{}'::jsonb,
      checksum varchar,
      outcome varchar NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}
