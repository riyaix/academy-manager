import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION } from "../constants";
import { SCHEMA_MIGRATIONS } from "./registry";

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../src-tauri/src/db/migrations",
);

function readMigrationSql(fileName: string): string {
  return readFileSync(join(migrationsDir, fileName), "utf8");
}

function applySql(db: DatabaseSync, sql: string): void {
  db.exec(sql);
}

describe("schema migrations", () => {
  it("keeps registry aligned with CURRENT_SCHEMA_VERSION", () => {
    const versions = SCHEMA_MIGRATIONS.map((migration) => migration.version);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    expect(versions[versions.length - 1]).toBe(CURRENT_SCHEMA_VERSION);
    expect(versions).toEqual(Array.from({ length: versions.length }, (_, index) => index + 1));
  });

  it("applies v2 without losing existing payment record rows", () => {
    const db = new DatabaseSync(":memory:");

    applySql(db, readMigrationSql("001_initial_schema.sql"));

    db.prepare(
      `INSERT INTO students (
        student_id, guardian_first_name, guardian_last_name, enrolled_at, status
      ) VALUES (?, ?, ?, ?, ?)`,
    ).run("STU-1", "Jane", "Doe", "2026-01-01", "active");

    db.prepare(
      `INSERT INTO payment_records (
        record_id, issued_on, student_id, payer_name, total, status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run("F-2026-001", "2026-01-15", "STU-1", "Jane Doe", 120, "pending");

    const before = db
      .prepare("SELECT record_id, total, status FROM payment_records")
      .all() as Array<{ record_id: string; total: number; status: string }>;

    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({
      record_id: "F-2026-001",
      total: 120,
      status: "pending",
    });

    applySql(db, readMigrationSql("002_payment_record_voided_at.sql"));
    applySql(db, readMigrationSql("003_payment_record_group_ids.sql"));

    const columns = db.prepare("PRAGMA table_info(payment_records)").all() as Array<{
      name: string;
    }>;
    expect(columns.some((column) => column.name === "voided_at")).toBe(true);
    expect(columns.some((column) => column.name === "group_ids_json")).toBe(true);

    const after = db
      .prepare("SELECT record_id, total, status, voided_at, group_ids_json FROM payment_records")
      .all() as Array<{
      record_id: string;
      total: number;
      status: string;
      voided_at: string | null;
      group_ids_json: string;
    }>;

    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({
      record_id: "F-2026-001",
      total: 120,
      status: "pending",
      voided_at: null,
      group_ids_json: "[]",
    });

    const schemaVersion = db
      .prepare("SELECT version, description FROM schema_version ORDER BY version DESC LIMIT 1")
      .get() as { version: number; description: string };

    expect(schemaVersion).toEqual({
      version: 3,
      description: "payment_record_group_ids",
    });

    db.close();
  });
});
