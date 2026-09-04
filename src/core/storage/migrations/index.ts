export { migrate, ensureSchemaCurrent, getSchemaVersion, repairPendingSchema, type SchemaVersionInfo } from "./migrate";
export { getMigration, SCHEMA_MIGRATIONS, SCHEMA_MIGRATION_VERSIONS } from "./registry";
export type { DataMigrationFn, SchemaMigration } from "./types";
