import { describe, expect, it } from "vitest";
import { suggestedIncomeTaxReserve } from "./income-tax-reserve";
import { fromMoney, toMoney } from "./money";

describe("suggestedIncomeTaxReserve", () => {
  it("returns zero for non-positive collected amounts", () => {
    expect(fromMoney(suggestedIncomeTaxReserve(toMoney(0), "custom", 15))).toBe(0);
  });

  it("uses configured reserve rate in custom mode", () => {
    expect(fromMoney(suggestedIncomeTaxReserve(toMoney(1000), "custom", 15))).toBe(150);
  });

  it("falls back to 20% in standard tax mode", () => {
    expect(fromMoney(suggestedIncomeTaxReserve(toMoney(1000), "standard", 15))).toBe(200);
  });
});
