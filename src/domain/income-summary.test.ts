import { describe, expect, it } from "vitest";
import {
  isRecordInDateRange,
  summarizeMonthlyIncome,
  summarizePaymentRecordTotals,
  countMonthsInDateRange,
} from "./income-summary";
import { fromMoney, toMoney } from "./money";
import type { PaymentRecord } from "./payment-record";

function record(
  overrides: Partial<PaymentRecord> &
    Pick<PaymentRecord, "recordId" | "issuedOn" | "total" | "status">,
): PaymentRecord {
  return {
    studentId: "C001",
    payerName: "Test Family",
    lineItems: [],
    ...overrides,
  };
}

const sampleRecords: PaymentRecord[] = [
  record({
    recordId: "F-2026-001",
    issuedOn: "2026-03-05",
    total: toMoney(100),
    status: "paid",
  }),
  record({
    recordId: "F-2026-002",
    issuedOn: "2026-03-12",
    total: toMoney(50),
    status: "pending",
  }),
  record({
    recordId: "F-2026-003",
    issuedOn: "2026-04-01",
    total: toMoney(75),
    status: "paid",
  }),
  record({
    recordId: "F-2026-004",
    issuedOn: "2026-03-20",
    total: toMoney(25),
    status: "voided",
  }),
  record({
    recordId: "F-2026-005",
    issuedOn: "2025-12-31",
    total: toMoney(999),
    status: "paid",
  }),
];

describe("isRecordInDateRange", () => {
  it("includes records inside an inclusive range", () => {
    expect(isRecordInDateRange("2026-03-01", { from: "2026-03-01", to: "2026-03-31" })).toBe(true);
    expect(isRecordInDateRange("2026-03-31", { from: "2026-03-01", to: "2026-03-31" })).toBe(true);
  });

  it("excludes records outside the range", () => {
    expect(isRecordInDateRange("2026-02-28", { from: "2026-03-01", to: "2026-03-31" })).toBe(false);
    expect(isRecordInDateRange("2026-04-01", { from: "2026-03-01", to: "2026-03-31" })).toBe(false);
  });
});

describe("countMonthsInDateRange", () => {
  it("counts inclusive calendar months", () => {
    expect(
      countMonthsInDateRange({
        from: "2026-01-01",
        to: "2026-03-15",
      }),
    ).toBe(3);
  });
});

describe("summarizePaymentRecordTotals", () => {
  it("matches payment-history totals for a date range", () => {
    const totals = summarizePaymentRecordTotals(sampleRecords, {
      from: "2026-03-01",
      to: "2026-03-31",
    });

    expect(fromMoney(totals.issued)).toBe(150);
    expect(fromMoney(totals.collected)).toBe(100);
    expect(fromMoney(totals.pending)).toBe(50);
  });

  it("ignores voided records", () => {
    const totals = summarizePaymentRecordTotals(sampleRecords, {
      from: "2026-01-01",
      to: "2026-12-31",
    });
    expect(fromMoney(totals.issued)).toBe(225);
    expect(fromMoney(totals.collected)).toBe(175);
    expect(fromMoney(totals.pending)).toBe(50);
  });
});

describe("summarizeMonthlyIncome", () => {
  it("groups paid and pending amounts by month", () => {
    const rows = summarizeMonthlyIncome(sampleRecords, {
      from: "2026-01-01",
      to: "2026-12-31",
    });

    expect(
      rows.map((row) => ({
        monthKey: row.monthKey,
        collected: fromMoney(row.collected),
        pending: fromMoney(row.pending),
      })),
    ).toEqual([
      { monthKey: "2026-03", collected: 100, pending: 50 },
      { monthKey: "2026-04", collected: 75, pending: 0 },
    ]);
  });
});
