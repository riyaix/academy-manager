import type { SchemaMigration } from "./types";

/**
 * Application schema migrations — keep in sync with `src-tauri/src/db/mod.rs`.
 * SQL DDL lives in Rust; register data backfills here when needed.
 */
export const SCHEMA_MIGRATIONS: readonly SchemaMigration[] = [
  { version: 1, description: "initial_schema" },
  { version: 2, description: "payment_record_voided_at" },
  { version: 3, description: "payment_record_group_ids" },
] as const;

export const SCHEMA_MIGRATION_VERSIONS = SCHEMA_MIGRATIONS.map(
  (migration) => migration.version,
);

export function getMigration(version: number): SchemaMigration | undefined {
  return SCHEMA_MIGRATIONS.find((migration) => migration.version === version);
}
