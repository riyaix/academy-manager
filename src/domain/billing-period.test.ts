import { describe, expect, it } from "vitest";
import { formatBillingPeriod } from "./billing-period";

describe("formatBillingPeriod", () => {
  const t = (key: string) => (key === "months.march" ? "Marzo" : key);

  it("formats localized month and year", () => {
    expect(formatBillingPeriod(t, new Date(2026, 2, 15))).toBe("Marzo 2026");
  });
});
