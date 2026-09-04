import { describe, expect, it } from "vitest";
import { toMoney, fromMoney } from "./money";
import {
  overdueAgingBuckets,
  summarizePaymentStatusBreakdown,
  topStudentsByRevenue,
} from "./reports";
import type { PaymentRecord } from "./payment-record";

const records: PaymentRecord[] = [
  {
    recordId: "F1",
    issuedOn: "2026-03-01",
    studentId: "C001",
    payerName: "Ana",
    lineItems: [],
    total: toMoney(100),
    status: "paid",
  },
  {
    recordId: "F2",
    issuedOn: "2026-03-01",
    studentId: "C002",
    payerName: "Luis",
    lineItems: [],
    total: toMoney(40),
    status: "pending",
  },
  {
    recordId: "F3",
    issuedOn: "2025-12-01",
    studentId: "C001",
    payerName: "Ana",
    lineItems: [],
    total: toMoney(50),
    status: "paid",
  },
];

describe("reports helpers", () => {
  it("summarizes status breakdown", () => {
    const breakdown = summarizePaymentStatusBreakdown(records);
    expect(fromMoney(breakdown.paid)).toBe(150);
    expect(fromMoney(breakdown.pending)).toBe(40);
  });

  it("ranks students by revenue", () => {
    const top = topStudentsByRevenue(records, 2);
    expect(top[0]?.studentId).toBe("C001");
    expect(fromMoney(top[0].total)).toBe(150);
  });

  it("buckets overdue pending records", () => {
    const aging = overdueAgingBuckets(
      [
        {
          recordId: "F4",
          issuedOn: "2026-08-20",
          studentId: "C003",
          payerName: "Eva",
          lineItems: [],
          total: toMoney(20),
          status: "pending",
        },
      ],
      new Date("2026-09-03"),
    );
    expect(aging.find((bucket) => bucket.bucket === "0-30")?.count).toBe(1);
  });
});
