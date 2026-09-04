import type { Money } from "./money";
import { addMoney, fromMoney, toMoney } from "./money";
import { parsePaymentRecordSequence } from "./ids";
import type { PaymentRecord } from "./payment-record";
import { normalizeTaxMode, type TaxMode } from "./settings";

export type TaxBreakdown = {
  subtotal: Money;
  vatRate: number;
  vatAmount: Money;
  totalWithVat: Money;
  incomeTaxReserveRate: number;
  incomeTaxReserveAmount: Money;
};

export type DuplicateBillingConflict = {
  recordId: string;
  payerName: string;
  billingPeriod: string;
  groupIds: string[];
};

/** Informational tax notes for personal bookkeeping — not legal invoice math. */
export function calculateTaxBreakdown(
  subtotal: Money,
  taxMode: TaxMode | string,
  vatRate: number,
  incomeTaxReserveRate: number,
): TaxBreakdown {
  const usesCustomTax = normalizeTaxMode(taxMode) === "custom";
  const effectiveVatRate = usesCustomTax ? vatRate : 0;
  const effectiveReserveRate = usesCustomTax ? incomeTaxReserveRate : 20;

  const vatAmount = toMoney(fromMoney(subtotal) * (effectiveVatRate / 100));
  const totalWithVat = addMoney(subtotal, vatAmount);
  const incomeTaxReserveAmount = toMoney(fromMoney(subtotal) * (effectiveReserveRate / 100));

  return {
    subtotal,
    vatRate: effectiveVatRate,
    vatAmount,
    totalWithVat,
    incomeTaxReserveRate: effectiveReserveRate,
    incomeTaxReserveAmount,
  };
}

/** Records that would conflict with a new batch for the same period and groups. */
export function findDuplicateBatchBilling(
  existingRecords: PaymentRecord[],
  billingPeriod: string,
  groupIds: string[],
): DuplicateBillingConflict[] {
  if (!billingPeriod.trim() || groupIds.length === 0) return [];

  const selectedGroups = new Set(groupIds);

  return existingRecords
    .filter((record) => record.status !== "voided")
    .filter((record) => record.billingPeriod === billingPeriod)
    .filter((record) => (record.groupIds ?? []).some((groupId) => selectedGroups.has(groupId)))
    .map((record) => ({
      recordId: record.recordId,
      payerName: record.payerName,
      billingPeriod: record.billingPeriod ?? billingPeriod,
      groupIds: record.groupIds ?? [],
    }));
}

/** Allocate N unique payment record IDs using max(existing, stored counter) + 1. */
export function allocatePaymentRecordIds(
  count: number,
  existingRecords: PaymentRecord[],
  storedCounters: Record<string, number>,
  year: number = new Date().getFullYear(),
): { ids: string[]; nextCounters: Record<string, number> } {
  if (count <= 0) return { ids: [], nextCounters: storedCounters };

  let maxFromRecords = 0;
  for (const record of existingRecords) {
    const sequence = parsePaymentRecordSequence(record.recordId, year);
    if (sequence !== null) maxFromRecords = Math.max(maxFromRecords, sequence);
  }

  const storedForYear = storedCounters[String(year)] ?? 0;
  let nextSequence = Math.max(maxFromRecords, storedForYear) + 1;

  const ids: string[] = [];
  for (let index = 0; index < count; index++) {
    ids.push(`F-${year}-${(nextSequence + index).toString().padStart(3, "0")}`);
  }

  return {
    ids,
    nextCounters: {
      ...storedCounters,
      [String(year)]: nextSequence + count - 1,
    },
  };
}
