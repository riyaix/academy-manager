import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION } from "../constants";
import { getMigration, SCHEMA_MIGRATIONS } from "./registry";

describe("migration registry", () => {
  it("lists every version from 1 through CURRENT_SCHEMA_VERSION", () => {
    const versions = SCHEMA_MIGRATIONS.map((migration) => migration.version);
    expect(versions).toEqual(
      Array.from({ length: CURRENT_SCHEMA_VERSION }, (_, index) => index + 1),
    );
  });

  it("resolves migration metadata by version", () => {
    expect(getMigration(1)?.description).toBe("initial_schema");
    expect(getMigration(2)?.description).toBe("payment_record_voided_at");
    expect(getMigration(3)?.description).toBe("payment_record_group_ids");
    expect(getMigration(99)).toBeUndefined();
  });
});
