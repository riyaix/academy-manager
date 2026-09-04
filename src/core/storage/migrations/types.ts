import type Database from "@tauri-apps/plugin-sql";

/** Optional data migration run after SQL DDL has been applied. */
export type DataMigrationFn = (db: Database) => Promise<void>;

export type SchemaMigration = {
  version: number;
  description: string;
  /** Runs in TypeScript after the matching SQL migration is applied. */
  dataMigration?: DataMigrationFn;
};
