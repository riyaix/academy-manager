import { describe, expect, it } from "vitest";
import {
  allocatePaymentRecordIds,
  calculateTaxBreakdown,
  findDuplicateBatchBilling,
} from "./billing";
import type { PaymentRecord } from "./payment-record";
import { toMoney, fromMoney } from "./money";

function record(overrides: Partial<PaymentRecord>): PaymentRecord {
  return {
    recordId: "F-2026-001",
    issuedOn: "2026-01-01",
    studentId: "C001",
    payerName: "Test",
    lineItems: [],
    total: toMoney(0),
    status: "pending",
    ...overrides,
  };
}

describe("allocatePaymentRecordIds", () => {
  const existing = [record({ recordId: "F-2026-003" })];

  it("allocates sequential ids without duplicates in a batch", () => {
    const first = allocatePaymentRecordIds(3, existing, { "2026": 3 });
    expect(first.ids).toEqual(["F-2026-004", "F-2026-005", "F-2026-006"]);
    expect(first.nextCounters["2026"]).toBe(6);

    const second = allocatePaymentRecordIds(
      2,
      [...existing, ...first.ids.map((recordId) => record({ recordId }))],
      first.nextCounters,
    );
    expect(second.ids).toEqual(["F-2026-007", "F-2026-008"]);
  });

  it("never reuses numbers below stored counter", () => {
    const result = allocatePaymentRecordIds(1, [], { "2026": 10 });
    expect(result.ids).toEqual(["F-2026-011"]);
  });
});

describe("findDuplicateBatchBilling", () => {
  const records: PaymentRecord[] = [
    record({
      recordId: "F-2026-001",
      issuedOn: "2026-03-01",
      payerName: "Familia Lopez",
      total: toMoney(50),
      billingPeriod: "Marzo 2026",
      groupIds: ["G001", "G002"],
    }),
    record({
      recordId: "F-2026-002",
      studentId: "C002",
      payerName: "Voided",
      total: toMoney(50),
      status: "voided",
      billingPeriod: "Marzo 2026",
      groupIds: ["G001"],
    }),
  ];

  it("finds conflicts for same period and overlapping groups", () => {
    const conflicts = findDuplicateBatchBilling(records, "Marzo 2026", ["G002"]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].recordId).toBe("F-2026-001");
  });

  it("ignores voided records", () => {
    const conflicts = findDuplicateBatchBilling(records, "Marzo 2026", ["G001"]);
    expect(conflicts.map((item) => item.recordId)).toEqual(["F-2026-001"]);
  });
});

describe("calculateTaxBreakdown", () => {
  it("applies custom vat in custom mode", () => {
    const tax = calculateTaxBreakdown(toMoney(100), "custom", 21, 15);
    expect(fromMoney(tax.vatAmount)).toBe(21);
    expect(fromMoney(tax.totalWithVat)).toBe(121);
    expect(fromMoney(tax.incomeTaxReserveAmount)).toBe(15);
  });

  it("uses zero vat in standard mode with 20% reserve hint", () => {
    const tax = calculateTaxBreakdown(toMoney(100), "standard", 21, 15);
    expect(fromMoney(tax.vatAmount)).toBe(0);
    expect(tax.incomeTaxReserveRate).toBe(20);
    expect(fromMoney(tax.incomeTaxReserveAmount)).toBe(20);
  });
});
