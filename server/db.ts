import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export function isDatabaseRequired(): boolean {
  return process.env.REQUIRE_DATABASE === "true" || process.env.NODE_ENV === "production";
}

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  : null;

export const db = pool ? drizzle({ client: pool }) : null;

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!pool) return false;
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    return true;
  } finally {
    client.release();
  }
}

export async function gracefulShutdown(): Promise<void> {
  await pool?.end();
}
