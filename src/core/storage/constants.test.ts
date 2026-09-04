import { describe, expect, it } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  DATABASE_CONNECTION,
  DATABASE_FILE,
  SETTINGS_SECTION_KEYS,
  TABLE_NAMES,
} from "./constants";

describe("storage constants", () => {
  it("uses facturador.db as the SQLite file", () => {
    expect(DATABASE_FILE).toBe("facturador.db");
    expect(DATABASE_CONNECTION).toBe("sqlite:facturador.db");
  });

  it("tracks the latest schema migration version", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
  });

  it("exposes table names for all domain entities", () => {
    expect(TABLE_NAMES.students).toBe("students");
    expect(TABLE_NAMES.courses).toBe("courses");
    expect(TABLE_NAMES.classGroups).toBe("class_groups");
    expect(TABLE_NAMES.enrollments).toBe("enrollments");
    expect(TABLE_NAMES.paymentRecords).toBe("payment_records");
    expect(TABLE_NAMES.schemaVersion).toBe("schema_version");
  });

  it("lists settings section keys matching AppSettings slices", () => {
    expect(SETTINGS_SECTION_KEYS).toEqual([
      "branding",
      "organization",
      "tax",
      "appearance",
      "fixed_costs",
      "privacy",
      "locale",
      "backup",
    ]);
  });
});
