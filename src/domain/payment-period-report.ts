import { fromMoney } from "./money";
import type { PaymentRecord } from "./payment-record";

export type PaymentPeriodReportRow = {
  month: string;
  student: string;
  amount: string;
  status: string;
};

export type PaymentPeriodReportHeaders = {
  month: string;
  student: string;
  amount: string;
  status: string;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function paymentRecordToReportRow(
  record: PaymentRecord,
  statusLabel: string,
): PaymentPeriodReportRow {
  const month = record.billingPeriod?.trim() || record.issuedOn.substring(0, 7);

  return {
    month,
    student: record.payerName,
    amount: fromMoney(record.total).toFixed(2),
    status: statusLabel,
  };
}

export function buildPaymentPeriodReportCsv(
  headers: PaymentPeriodReportHeaders,
  rows: PaymentPeriodReportRow[],
): string {
  const headerLine = [headers.month, headers.student, headers.amount, headers.status]
    .map((cell) => escapeCsvCell(String(cell)))
    .join(",");

  const dataLines = rows.map((row) =>
    [row.month, row.student, row.amount, row.status]
      .map((cell) => escapeCsvCell(String(cell)))
      .join(","),
  );

  return [headerLine, ...dataLines].join("\n");
}
