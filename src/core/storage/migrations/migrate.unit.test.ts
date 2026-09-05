import { describe, expect, it, vi } from "vitest";
import { CURRENT_SCHEMA_VERSION } from "../constants";
import { ensureSchemaCurrent, migrate, repairPendingSchema } from "./migrate";
import * as registry from "./registry";

function createMockDb(options: { schemaVersion: number | null; columns?: string[] }) {
  const columns = new Set(options.columns ?? ["record_id", "status"]);
  let schemaVersion = options.schemaVersion;

  return {
    select: vi.fn(async (query: string) => {
      if (query.includes("PRAGMA table_info")) {
        return [...columns].map((name) => ({ name }));
      }
      if (schemaVersion === null) return [];
      return [
        {
          version: schemaVersion,
          description: "test",
          applied_at: "2026-01-01T00:00:00Z",
        },
      ];
    }),
    execute: vi.fn(async (query: string) => {
      if (query.startsWith("ALTER TABLE") && query.includes("voided_at")) {
        columns.add("voided_at");
      }
      if (query.startsWith("ALTER TABLE") && query.includes("group_ids_json")) {
        columns.add("group_ids_json");
      }
      if (query.includes("INSERT OR IGNORE INTO schema_version")) {
        const match = /VALUES \(\$1, \$2\)/.test(query);
        if (match) {
          // version is bound as first arg — handled below via execute mock args in tests
        }
      }
      return 0;
    }),
    _setSchemaVersion(version: number) {
      schemaVersion = version;
    },
    _columns: columns,
  };
}

describe("migrate()", () => {
  it("rejects downgrades", async () => {
    const db = createMockDb({ schemaVersion: 2 });
    await expect(migrate(db as never, 2, 1)).rejects.toThrow(/downgrade/i);
  });

  it("runs registered data migrations in order", async () => {
    const calls: number[] = [];
    const db = createMockDb({ schemaVersion: 2 });

    vi.spyOn(registry, "getMigration").mockImplementation((version) => {
      if (version === 2) {
        return {
          version: 2,
          description: "demo_data_migration",
          dataMigration: async () => {
            calls.push(2);
          },
        };
      }
      if (version === 3) {
        return {
          version: 3,
          description: "demo_data_migration_2",
          dataMigration: async () => {
            calls.push(3);
          },
        };
      }
      return registry.getMigration(version);
    });

    await migrate(db as never, 1, 3);
    expect(calls).toEqual([2, 3]);

    vi.restoreAllMocks();
  });
});

describe("repairPendingSchema()", () => {
  it("adds missing payment_record columns and records schema versions", async () => {
    const db = createMockDb({
      schemaVersion: 1,
      columns: ["record_id", "issued_on", "status"],
    });

    await repairPendingSchema(db as never, 1);

    const alters = db.execute.mock.calls
      .map((call) => String(call[0]))
      .filter((sql) => sql.startsWith("ALTER TABLE"));
    expect(alters.some((sql) => sql.includes("voided_at"))).toBe(true);
    expect(alters.some((sql) => sql.includes("group_ids_json"))).toBe(true);
    expect(db._columns.has("voided_at")).toBe(true);
    expect(db._columns.has("group_ids_json")).toBe(true);
  });
});

describe("ensureSchemaCurrent()", () => {
  it("returns the active version when the database matches the app", async () => {
    const db = createMockDb({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      columns: ["record_id", "voided_at", "group_ids_json"],
    });
    await expect(ensureSchemaCurrent(db as never)).resolves.toBe(CURRENT_SCHEMA_VERSION);
  });

  it("repairs when the database is behind the app", async () => {
    const db = createMockDb({
      schemaVersion: 1,
      columns: ["record_id", "status"],
    });

    db.execute.mockImplementation(async (query: string, binds?: unknown[]) => {
      if (query.startsWith("ALTER TABLE") && query.includes("voided_at")) {
        db._columns.add("voided_at");
      }
      if (query.startsWith("ALTER TABLE") && query.includes("group_ids_json")) {
        db._columns.add("group_ids_json");
      }
      if (query.includes("INSERT OR IGNORE INTO schema_version") && Array.isArray(binds)) {
        const version = Number(binds[0]);
        if (version > (1 as number)) {
          db._setSchemaVersion(version);
        }
      }
      return 0;
    });

    await expect(ensureSchemaCurrent(db as never)).resolves.toBe(CURRENT_SCHEMA_VERSION);
  });

  it("fails when the database is newer than the app", async () => {
    const db = createMockDb({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 });
    await expect(ensureSchemaCurrent(db as never)).rejects.toThrow(/newer than this app/i);
  });
});
