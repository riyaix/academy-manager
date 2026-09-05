import { describe, expect, it } from "vitest";
import { buildPaymentPeriodReportCsv, paymentRecordToReportRow } from "./payment-period-report";
import { toMoney } from "./money";
import type { PaymentRecord } from "./payment-record";

const record: PaymentRecord = {
  recordId: "F-2026-001",
  issuedOn: "2026-03-05",
  studentId: "C001",
  payerName: "Familia López",
  lineItems: [],
  total: toMoney(120.5),
  status: "paid",
  billingPeriod: "Marzo 2026",
};

describe("paymentRecordToReportRow", () => {
  it("prefers billing period as month label", () => {
    expect(paymentRecordToReportRow(record, "Pagada")).toEqual({
      month: "Marzo 2026",
      student: "Familia López",
      amount: "120.50",
      status: "Pagada",
    });
  });
});

describe("buildPaymentPeriodReportCsv", () => {
  it("builds a spreadsheet-friendly CSV", () => {
    const csv = buildPaymentPeriodReportCsv(
      {
        month: "Month",
        student: "Student",
        amount: "Amount",
        status: "Status",
      },
      [paymentRecordToReportRow(record, "Pagada")],
    );

    expect(csv).toBe("Month,Student,Amount,Status\nMarzo 2026,Familia López,120.50,Pagada");
  });
});
