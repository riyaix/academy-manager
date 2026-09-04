import type { Money } from "./money";
import { addMoney } from "./money";
import type { PaymentRecord } from "./payment-record";
import type { ISODate } from "./shared";

export type IncomeDateRange = {
  from?: ISODate;
  to?: ISODate;
};

export type IncomeSummaryTotals = {
  /** Sum of non-voided records in range (paid + pending). */
  issued: Money;
  collected: Money;
  pending: Money;
};

export type MonthlyIncomeSummary = {
  /** `YYYY-MM` bucket key. */
  monthKey: string;
  collected: Money;
  pending: Money;
};

export function isRecordInDateRange(issuedOn: ISODate, range?: IncomeDateRange): boolean {
  if (!issuedOn) return false;

  const date = new Date(issuedOn);
  if (range?.from && date < new Date(range.from)) return false;
  if (range?.to && date > new Date(range.to)) return false;

  return true;
}

export function summarizePaymentRecordTotals(
  records: PaymentRecord[],
  range?: IncomeDateRange,
): IncomeSummaryTotals {
  const totals: IncomeSummaryTotals = {
    issued: 0 as Money,
    collected: 0 as Money,
    pending: 0 as Money,
  };

  for (const record of records) {
    if (record.status === "voided") continue;
    if (!isRecordInDateRange(record.issuedOn, range)) continue;

    totals.issued = addMoney(totals.issued, record.total);
    if (record.status === "paid") totals.collected = addMoney(totals.collected, record.total);
    if (record.status === "pending") totals.pending = addMoney(totals.pending, record.total);
  }

  return totals;
}

export function summarizeMonthlyIncome(
  records: PaymentRecord[],
  range?: IncomeDateRange,
): MonthlyIncomeSummary[] {
  const byMonth = new Map<string, { collected: Money; pending: Money }>();

  for (const record of records) {
    if (record.status === "voided") continue;
    if (!isRecordInDateRange(record.issuedOn, range)) continue;

    const monthKey = record.issuedOn.substring(0, 7);
    const entry = byMonth.get(monthKey) ?? { collected: 0 as Money, pending: 0 as Money };

    if (record.status === "paid") entry.collected = addMoney(entry.collected, record.total);
    if (record.status === "pending") entry.pending = addMoney(entry.pending, record.total);

    byMonth.set(monthKey, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([monthKey, amounts]) => ({
      monthKey,
      collected: amounts.collected,
      pending: amounts.pending,
    }));
}

/** Inclusive calendar months touched by a date range. */
export function countMonthsInDateRange(range?: IncomeDateRange): number {
  if (!range?.from || !range?.to) return 1;

  const start = new Date(range.from);
  const end = new Date(range.to);
  if (end < start) return 0;

  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

