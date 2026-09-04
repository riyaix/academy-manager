import { invoke } from "@tauri-apps/api/core";
import type Database from "@tauri-apps/plugin-sql";
import { DATABASE_CONNECTION } from "./constants";
import { isTauriRuntime } from "./runtime";

export type SqlStatement = {
  query: string;
  values?: unknown[];
};

export type TransactionClient = Pick<Database, "execute" | "select">;

type SqlTransactionPayload = {
  db: string;
  statements: Array<{ query: string; values: unknown[] }>;
};

/**
 * Run writes atomically.
 *
 * On Tauri, BEGIN/COMMIT across separate plugin `execute` calls is unsafe because
 * each call may use a different pooled connection. Statements are recorded and
 * flushed through a Rust command that holds one connection for the transaction.
 *
 * In Node tests (single connection adapter), classic BEGIN/COMMIT is used.
 */
export async function withTransaction<T>(
  db: Database,
  operation: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  if (!isTauriRuntime()) {
    await db.execute("BEGIN");
    try {
      const result = await operation(db);
      await db.execute("COMMIT");
      return result;
    } catch (error) {
      await db.execute("ROLLBACK");
      throw error;
    }
  }

  const statements: SqlTransactionPayload["statements"] = [];
  const tx: TransactionClient = {
    execute: async (query: string, bindValues?: unknown[]) => {
      statements.push({ query, values: bindValues ?? [] });
      return { rowsAffected: 0, lastInsertId: 0 as unknown as number };
    },
    select: async () => {
      throw new Error(
        "select() is not supported inside withTransaction on Tauri; read before the transaction.",
      );
    },
  };

  const result = await operation(tx);
  if (statements.length > 0) {
    await invoke("run_sql_transaction", {
      db: DATABASE_CONNECTION,
      statements,
    } satisfies SqlTransactionPayload);
  }
  return result;
}

export async function runInTransaction(
  db: Database,
  operation: (tx: TransactionClient) => Promise<void>,
): Promise<void> {
  await withTransaction(db, async (tx) => {
    await operation(tx);
  });
}
