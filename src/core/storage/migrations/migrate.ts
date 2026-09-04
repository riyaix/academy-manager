import type Database from "@tauri-apps/plugin-sql";
import { CURRENT_SCHEMA_VERSION, TABLE_NAMES } from "../constants";
import type { SchemaVersionRow } from "../database";
import { getMigration, SCHEMA_MIGRATION_VERSIONS } from "./registry";

export type SchemaVersionInfo = {
  version: number;
  description: string;
  appliedAt: string;
};

/**
 * Column upgrades that may need a TypeScript fallback when the Tauri/sqlx
 * migrator could not run (checksum mismatch on an edited v1, or load retry
 * after a failed migrate emptied the in-memory migration list).
 *
 * Keep SQL aligned with `src-tauri/src/db/migrations/00N_*.sql`.
 */
const COLUMN_UPGRADES: readonly {
  version: number;
  description: string;
  column: string;
  alterSql: string;
  /** sha384 hex of the matching Rust migration SQL file (sqlx checksum). */
  sqlxChecksumHex: string;
}[] = [
  {
    version: 2,
    description: "payment_record_voided_at",
    column: "voided_at",
    alterSql: `ALTER TABLE ${TABLE_NAMES.paymentRecords} ADD COLUMN voided_at TEXT`,
    sqlxChecksumHex:
      "fe87e368af85e22e5646100663100d89df0cfee5e68810cdcd6ffae55584945c71a4a02113d53e47f221f1a416234f94",
  },
  {
    version: 3,
    description: "payment_record_group_ids",
    column: "group_ids_json",
    alterSql: `ALTER TABLE ${TABLE_NAMES.paymentRecords} ADD COLUMN group_ids_json TEXT NOT NULL DEFAULT '[]'`,
    sqlxChecksumHex:
      "a30ec56d680e5d75beaa4aa4fad305e5c86bd7d409d555fdc2cb730b55001879bd1d66d6f33e794ad3a324c17add2d21",
  },
];

/** Expected sha384 of immutable `001_initial_schema.sql` (never edit that file). */
const INITIAL_SCHEMA_CHECKSUM_HEX =
  "df8102cbd99766e88c87999abf46b31e48bcb4de8dce8867ee7567ee4dde77f3350dd7516ec9f6205c6e72febb396679";

/** Read the latest row from `schema_version`. */
export async function getSchemaVersion(db: Database): Promise<SchemaVersionInfo | null> {
  const rows = await db.select<SchemaVersionRow[]>(
    `SELECT version, description, applied_at
     FROM ${TABLE_NAMES.schemaVersion}
     ORDER BY version DESC
     LIMIT 1`,
  );

  const row = rows[0];
  if (!row) return null;

  return {
    version: row.version,
    description: row.description,
    appliedAt: row.applied_at,
  };
}

/**
 * Run registered data migrations from `fromVersion` to `toVersion` (inclusive).
 * SQL DDL is applied by Tauri before this runs (or by {@link repairPendingSchema}).
 */
export async function migrate(
  db: Database,
  fromVersion: number,
  toVersion: number,
): Promise<void> {
  if (fromVersion > toVersion) {
    throw new Error(
      `Schema downgrade from v${fromVersion} to v${toVersion} is not supported.`,
    );
  }

  for (let version = fromVersion + 1; version <= toVersion; version++) {
    const migration = getMigration(version);
    if (!migration) {
      throw new Error(`Missing data migration registry entry for schema v${version}.`);
    }

    if (migration.dataMigration) {
      await migration.dataMigration(db);
    }
  }
}

type PragmaColumnRow = { name: string };

async function paymentRecordColumns(db: Database): Promise<Set<string>> {
  const rows = await db.select<PragmaColumnRow[]>(
    `PRAGMA table_info(${TABLE_NAMES.paymentRecords})`,
  );
  return new Set(rows.map((row) => row.name));
}

async function syncSqlxMigrationRow(
  db: Database,
  version: number,
  description: string,
  checksumHex: string,
): Promise<void> {
  // Keep sqlx's bookkeeping aligned so the next cold start does not re-run ALTERs.
  await db.execute(
    `INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time)
     VALUES ($1, $2, 1, X'${checksumHex}', 0)
     ON CONFLICT(version) DO UPDATE SET
       description = excluded.description,
       success = 1,
       checksum = excluded.checksum`,
    [version, description],
  );
}

/**
 * Apply any missing DDL when `schema_version` lags the app.
 * Safe to call when sqlx already applied the same upgrades (column checks).
 */
export async function repairPendingSchema(db: Database, fromVersion: number): Promise<void> {
  const columns = await paymentRecordColumns(db);

  // Heal edited-v1 checksum so future sqlx migrates can proceed past version 1.
  await syncSqlxMigrationRow(db, 1, "initial_schema", INITIAL_SCHEMA_CHECKSUM_HEX);

  for (const step of COLUMN_UPGRADES) {
    if (step.version <= fromVersion) {
      // Still mark sqlx rows for already-recorded schema versions when repairing a
      // DB that reached schema_version via an older path.
      continue;
    }

    if (!columns.has(step.column)) {
      await db.execute(step.alterSql);
      columns.add(step.column);
    }

    await db.execute(
      `INSERT OR IGNORE INTO ${TABLE_NAMES.schemaVersion} (version, description)
       VALUES ($1, $2)`,
      [step.version, step.description],
    );

    await syncSqlxMigrationRow(db, step.version, step.description, step.sqlxChecksumHex);
  }
}

/** Validate schema version after Tauri SQL migrations and run any pending data migrations. */
export async function ensureSchemaCurrent(db: Database): Promise<number> {
  const current = await getSchemaVersion(db);
  const startingVersion = current?.version ?? 0;

  if (startingVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Database schema v${startingVersion} is newer than this app (v${CURRENT_SCHEMA_VERSION}). ` +
        "Update Facturador to continue.",
    );
  }

  let dbVersion = startingVersion;

  if (dbVersion < CURRENT_SCHEMA_VERSION) {
    await repairPendingSchema(db, dbVersion);
    const repaired = await getSchemaVersion(db);
    dbVersion = repaired?.version ?? 0;

    if (dbVersion < CURRENT_SCHEMA_VERSION) {
      throw new Error(
        `Database schema v${dbVersion} is behind expected v${CURRENT_SCHEMA_VERSION}. ` +
          "Pending SQL migrations were not applied.",
      );
    }
  }

  for (let index = 0; index < SCHEMA_MIGRATION_VERSIONS.length; index++) {
    const version = SCHEMA_MIGRATION_VERSIONS[index];
    if (version > CURRENT_SCHEMA_VERSION) {
      throw new Error(`Migration registry includes future version v${version}.`);
    }
    if (version !== index + 1) {
      throw new Error("Migration registry has gaps in version numbers.");
    }
  }

  await migrate(db, startingVersion, CURRENT_SCHEMA_VERSION);

  return dbVersion;
}
