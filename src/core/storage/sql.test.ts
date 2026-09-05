import { describe, expect, it } from "vitest";
import { createNodeSqliteAdapter, openMigratedMemoryDb } from "./test/nodeSqliteAdapter";
import { withTransaction } from "./sql";

describe("withTransaction", () => {
  it("commits successful work", async () => {
    const sync = openMigratedMemoryDb();
    const db = createNodeSqliteAdapter(sync);

    await withTransaction(db, async (tx) => {
      await tx.execute(`INSERT INTO settings_sections (section_key, data_json) VALUES ($1, $2)`, [
        "branding",
        '{"appName":"Ok"}',
      ]);
    });

    const rows = await db.select<Array<{ section_key: string }>>(
      "SELECT section_key FROM settings_sections",
    );
    expect(rows).toEqual([{ section_key: "branding" }]);
  });

  it("rolls back when the operation throws", async () => {
    const sync = openMigratedMemoryDb();
    const db = createNodeSqliteAdapter(sync);

    await expect(
      withTransaction(db, async (tx) => {
        await tx.execute(`INSERT INTO settings_sections (section_key, data_json) VALUES ($1, $2)`, [
          "branding",
          '{"appName":"Temp"}',
        ]);
        throw new Error("stop");
      }),
    ).rejects.toThrow("stop");

    const rows = await db.select<Array<{ section_key: string }>>(
      "SELECT section_key FROM settings_sections",
    );
    expect(rows).toEqual([]);
  });
});
