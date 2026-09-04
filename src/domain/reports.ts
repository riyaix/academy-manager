import type { Money } from "./money";
import { addMoney, fromMoney } from "./money";
import type { PaymentRecord } from "./payment-record";
import type { IncomeDateRange } from "./income-summary";
import { isRecordInDateRange } from "./income-summary";

export type PaymentStatusBreakdown = {
  paid: Money;
  pending: Money;
  voided: Money;
};

export type StudentRevenueRow = {
  studentId: string;
  payerName: string;
  total: Money;
};

export type OverdueAgingBucket = {
  bucket: "0-30" | "31-60" | "61-90" | "90+";
  count: number;
  total: Money;
};

export function summarizePaymentStatusBreakdown(
  records: PaymentRecord[],
  range?: IncomeDateRange,
): PaymentStatusBreakdown {
  const result: PaymentStatusBreakdown = {
    paid: 0 as Money,
    pending: 0 as Money,
    voided: 0 as Money,
  };

  for (const record of records) {
    if (!isRecordInDateRange(record.issuedOn, range)) continue;
    if (record.status === "paid") result.paid = addMoney(result.paid, record.total);
    if (record.status === "pending") result.pending = addMoney(result.pending, record.total);
    if (record.status === "voided") result.voided = addMoney(result.voided, record.total);
  }

  return result;
}

export function topStudentsByRevenue(
  records: PaymentRecord[],
  limit = 5,
  range?: IncomeDateRange,
): StudentRevenueRow[] {
  const byStudent = new Map<string, StudentRevenueRow>();

  for (const record of records) {
    if (record.status === "voided") continue;
    if (!isRecordInDateRange(record.issuedOn, range)) continue;

    const existing = byStudent.get(record.studentId);
    if (existing) {
      existing.total = addMoney(existing.total, record.total);
    } else {
      byStudent.set(record.studentId, {
        studentId: record.studentId,
        payerName: record.payerName,
        total: record.total,
      });
    }
  }

  return Array.from(byStudent.values())
    .sort((left, right) => fromMoney(right.total) - fromMoney(left.total))
    .slice(0, limit);
}

export function overdueAgingBuckets(
  records: PaymentRecord[],
  today = new Date(),
): OverdueAgingBucket[] {
  const buckets: Record<OverdueAgingBucket["bucket"], OverdueAgingBucket> = {
    "0-30": { bucket: "0-30", count: 0, total: 0 as Money },
    "31-60": { bucket: "31-60", count: 0, total: 0 as Money },
    "61-90": { bucket: "61-90", count: 0, total: 0 as Money },
    "90+": { bucket: "90+", count: 0, total: 0 as Money },
  };

  for (const record of records) {
    if (record.status !== "pending") continue;
    const issued = new Date(record.issuedOn);
    const days = Math.floor((today.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
    const key: OverdueAgingBucket["bucket"] =
      days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
    buckets[key].count += 1;
    buckets[key].total = addMoney(buckets[key].total, record.total);
  }

  return Object.values(buckets);
}
