import { describe, expect, it } from "vitest";
import { LEGACY_DOMAIN_STORAGE_KEYS } from "./clearLegacyDomainStorage";

describe("clearLegacyDomainStorage", () => {
  it("lists every legacy domain key for removal", () => {
    expect(LEGACY_DOMAIN_STORAGE_KEYS).toContain("db_clientes");
    expect(LEGACY_DOMAIN_STORAGE_KEYS).toContain("db_facturas");
    expect(LEGACY_DOMAIN_STORAGE_KEYS).toContain("app_payment_record_seq");
    expect(LEGACY_DOMAIN_STORAGE_KEYS.length).toBeGreaterThanOrEqual(18);
  });
});
