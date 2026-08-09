import fs from "fs";
import path from "path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
export const HUB_DIR = path.resolve(REPO_ROOT, process.env.CAPITAL_DATA_DIR || ".data");
// Compatibility name retained for migrated stores. The physical directory is
// ZILLION's own Memory partition, never ZAR/ZCOS shared memory.
export const HUB_SHARED_MEMORY_DIR = path.resolve(HUB_DIR, "memory");
export const HUB_LOG_DIR = path.resolve(HUB_DIR, "logs");
export const UPLOADS_DIR = path.resolve(HUB_DIR, "uploads");

for (const directory of [HUB_DIR, HUB_SHARED_MEMORY_DIR, HUB_LOG_DIR, UPLOADS_DIR]) {
  fs.mkdirSync(directory, { recursive: true });
}
