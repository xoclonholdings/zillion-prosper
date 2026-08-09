import fs from "fs/promises";
import path from "path";
import { sql } from "drizzle-orm";

import { db, isDatabaseRequired } from "../../db";
import { HUB_DIR } from "../../utils/repoPaths";

const FALLBACK_DIR = path.resolve(HUB_DIR, "budget", "state");

function fallbackFile(userId: string, kind: string): string {
  const safe = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.resolve(FALLBACK_DIR, `${safe(userId)}__${safe(kind)}.json`);
}

export async function readBudgetObject<T>(userId: string, kind: string): Promise<T | null> {
  if (db) {
    const result: any = await db.execute(
      sql`SELECT data FROM budget_state WHERE user_id = ${userId} AND kind = ${kind} LIMIT 1`,
    );
    const rows = result?.rows ?? (Array.isArray(result) ? result : []);
    return rows[0]?.data == null ? null : (rows[0].data as T);
  }
  if (isDatabaseRequired()) throw new Error("Budget state requires PostgreSQL.");
  try {
    return JSON.parse(await fs.readFile(fallbackFile(userId, kind), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeBudgetObject<T>(userId: string, kind: string, data: T): Promise<void> {
  if (db) {
    await db.execute(sql`
      INSERT INTO budget_state (user_id, kind, data, updated_at)
      VALUES (${userId}, ${kind}, ${JSON.stringify(data)}::jsonb, now())
      ON CONFLICT (user_id, kind)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `);
    return;
  }
  if (isDatabaseRequired()) throw new Error("Budget state requires PostgreSQL.");
  await fs.mkdir(FALLBACK_DIR, { recursive: true });
  await fs.writeFile(fallbackFile(userId, kind), JSON.stringify(data, null, 2), "utf8");
}
