import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { fileURLToPath } from "node:url";
import type Database from "@tauri-apps/plugin-sql";

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../src-tauri/src/db/migrations",
);

function readMigrationSql(fileName: string): string {
  return readFileSync(join(migrationsDir, fileName), "utf8");
}

function toPositionalSql(sql: string): string {
  return sql.replace(/\$\d+/g, "?");
}

/** Tauri-plugin-sql shaped client backed by Node's in-memory SQLite. */
export function createNodeSqliteAdapter(sync: DatabaseSync): Database {
  return {
    async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
      const statement = sync.prepare(toPositionalSql(query));
      const params = (bindValues ?? []) as SQLInputValue[];
      const rows = params.length > 0 ? statement.all(...params) : statement.all();
      return rows as T;
    },
    async execute(query: string, bindValues?: unknown[]) {
      const sql = toPositionalSql(query);
      const params = (bindValues ?? []) as SQLInputValue[];
      if (params.length > 0) {
        sync.prepare(sql).run(...params);
      } else {
        sync.exec(sql);
      }
      return { rowsAffected: 0 };
    },
  } as Database;
}

export function openMigratedMemoryDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(readMigrationSql("001_initial_schema.sql"));
  db.exec(readMigrationSql("002_payment_record_voided_at.sql"));
  db.exec(readMigrationSql("003_payment_record_group_ids.sql"));
  return db;
}
