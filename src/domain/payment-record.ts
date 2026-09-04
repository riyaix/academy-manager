import type { Money } from "./money";
import { addMoney, multiplyMoney } from "./money";
import type { EntityId, ISODate } from "./shared";

export type PaymentRecordStatus = "paid" | "pending" | "voided";

export type PaymentLineItem = {
  description: string;
  quantity: number;
  unitPrice: Money;
};

/** Internal payment record / receipt — not a legal invoice. */
export type PaymentRecord = {
  recordId: EntityId;
  issuedOn: ISODate;
  studentId: EntityId;
  payerName: string;
  lineItems: PaymentLineItem[];
  total: Money;
  status: PaymentRecordStatus;
  billingPeriod?: string;
  paymentMethod?: string;
  groupIds?: EntityId[];
  /** ISO timestamp when the record was voided (audit trail). */
  voidedAt?: string;
};

export type PaymentRecordDraft = Omit<PaymentRecord, "recordId" | "total"> & {
  recordId?: EntityId;
  total?: number;
};

export function calculatePaymentTotal(lineItems: PaymentLineItem[]): Money {
  return addMoney(...lineItems.map((line) => multiplyMoney(line.unitPrice, line.quantity)));
}
