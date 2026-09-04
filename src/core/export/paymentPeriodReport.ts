import type { PaymentRecord, PaymentRecordStatus } from "../../domain/payment-record";
import {
  buildPaymentPeriodReportCsv,
  paymentRecordToReportRow,
  type PaymentPeriodReportHeaders,
} from "../../domain/payment-period-report";

export function downloadPaymentPeriodReportCsv(
  records: PaymentRecord[],
  headers: PaymentPeriodReportHeaders,
  resolveStatusLabel: (status: PaymentRecordStatus | string) => string,
  filename: string,
): void {
  const rows = records.map((record) =>
    paymentRecordToReportRow(record, resolveStatusLabel(record.status)),
  );

  const csv = buildPaymentPeriodReportCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
