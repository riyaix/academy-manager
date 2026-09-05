import { describe, expect, it } from "vitest";
import {
  netCollectedAfterFixedCosts,
  sumMonthlyFixedCosts,
  totalFixedCostsForRange,
} from "./fixed-costs";
import { fromMoney, toMoney } from "./money";
import type { FixedCosts } from "./settings";

const sampleCosts: FixedCosts = {
  selfEmployedFee: toMoney(300),
  rent: toMoney(650),
  other: toMoney(50),
};

describe("sumMonthlyFixedCosts", () => {
  it("sums all monthly cost lines", () => {
    expect(fromMoney(sumMonthlyFixedCosts(sampleCosts))).toBe(1000);
  });
});

describe("totalFixedCostsForRange", () => {
  it("multiplies monthly total by months in range", () => {
    expect(
      fromMoney(
        totalFixedCostsForRange(sampleCosts, {
          from: "2026-01-01",
          to: "2026-03-31",
        }),
      ),
    ).toBe(3000);
  });
});

describe("netCollectedAfterFixedCosts", () => {
  it("subtracts period fixed costs from collected income", () => {
    expect(
      fromMoney(
        netCollectedAfterFixedCosts(toMoney(5000), sampleCosts, {
          from: "2026-01-01",
          to: "2026-02-28",
        }),
      ),
    ).toBe(3000);
  });
});
