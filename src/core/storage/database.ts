import type Database from "@tauri-apps/plugin-sql";
import { DATABASE_CONNECTION } from "./constants";
import { ensureSchemaCurrent } from "./migrations";
import { isTauriRuntime } from "./runtime";

export type SchemaVersionRow = {
  version: number;
  description: string;
  applied_at: string;
};

let databasePromise: Promise<Database> | null = null;

const MAX_LOAD_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadDatabase(): Promise<Database> {
  const { default: DatabaseClient } = await import("@tauri-apps/plugin-sql");
  return DatabaseClient.load(DATABASE_CONNECTION);
}

async function loadDatabaseWithRetry(attempt: number): Promise<Database> {
  try {
    return await loadDatabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Migration checksum / version errors will not succeed on retry: the plugin
    // removes the migration list from memory before apply, so a second load
    // opens the DB without migrating.
    const nonRetryable = /migration|checksum|version mismatch|modified|dirty/i.test(message);

    if (nonRetryable || attempt >= MAX_LOAD_ATTEMPTS) {
      throw error;
    }

    // Exponential backoff: 0.25s → 0.5s → 1s (approx).
    const delayMs = BASE_BACKOFF_MS * 2 ** (attempt - 1);
    await sleep(delayMs);
    return loadDatabaseWithRetry(attempt + 1);
  }
}

/** Open (or reuse) the SQLite database and apply pending migrations. */
export async function getDatabase(): Promise<Database> {
  if (!isTauriRuntime()) {
    throw new Error("SQLite is only available in the Tauri desktop runtime.");
  }

  if (!databasePromise) {
    databasePromise = loadDatabaseWithRetry(1).catch((error) => {
      // Important: don't cache a rejected promise forever.
      databasePromise = null;
      throw error;
    });
  }

  try {
    return await databasePromise;
  } catch (error) {
    // Another safety net for concurrent callers.
    databasePromise = null;
    throw error;
  }
}

/** Ensure SQL migrations are applied and return the active schema version. */
export async function initializeDatabase(): Promise<number> {
  const db = await getDatabase();
  return ensureSchemaCurrent(db);
}

/** Close the shared connection (mainly for tests or app shutdown). */
export async function closeDatabase(): Promise<void> {
  if (!databasePromise) return;

  const db = await databasePromise;
  await db.close();
  databasePromise = null;
}
