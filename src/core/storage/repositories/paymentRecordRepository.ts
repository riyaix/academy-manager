import type { PaymentRecord } from "../../../domain/payment-record";
import { toMoney } from "../../../domain/money";
import { TABLE_NAMES } from "../constants";
import { getDatabase } from "../database";
import {
  lineItemToRow,
  paymentRecordToRow,
  rowToPaymentRecord,
  type PaymentRecordLineItemRow,
  type PaymentRecordRow,
} from "../mappers";
import { runInTransaction } from "../sql";

const INSERT_RECORD_SQL = `INSERT INTO ${TABLE_NAMES.paymentRecords} (
  record_id, issued_on, student_id, payer_name, total, status,
  billing_period, payment_method, group_ids_json, voided_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

const INSERT_LINE_SQL = `INSERT INTO ${TABLE_NAMES.paymentRecordLineItems} (
  record_id, position, description, quantity, unit_price
) VALUES ($1, $2, $3, $4, $5)`;

export async function listPaymentRecords(): Promise<PaymentRecord[]> {
  const db = await getDatabase();
  const rows = await db.select<PaymentRecordRow[]>(
    `SELECT * FROM ${TABLE_NAMES.paymentRecords} ORDER BY issued_on DESC, record_id DESC`,
  );
  if (rows.length === 0) return [];

  const lineRows = await db.select<PaymentRecordLineItemRow[]>(
    `SELECT * FROM ${TABLE_NAMES.paymentRecordLineItems}
     ORDER BY record_id ASC, position ASC`,
  );

  const linesByRecord = new Map<string, PaymentRecord["lineItems"]>();
  for (const line of lineRows) {
    const existing = linesByRecord.get(line.record_id) ?? [];
    existing.push({
      description: line.description,
      quantity: line.quantity,
      unitPrice: toMoney(line.unit_price),
    });
    linesByRecord.set(line.record_id, existing);
  }

  return rows.map((row) => rowToPaymentRecord(row, linesByRecord.get(row.record_id) ?? []));
}

export async function replaceAllPaymentRecords(records: PaymentRecord[]): Promise<void> {
  const db = await getDatabase();
  await runInTransaction(db, async (tx) => {
    await tx.execute(`DELETE FROM ${TABLE_NAMES.paymentRecords}`);
    for (const record of records) {
      const row = paymentRecordToRow(record);
      await tx.execute(INSERT_RECORD_SQL, [
        row.record_id,
        row.issued_on,
        row.student_id,
        row.payer_name,
        row.total,
        row.status,
        row.billing_period,
        row.payment_method,
        row.group_ids_json,
        row.voided_at,
      ]);

      for (let index = 0; index < record.lineItems.length; index++) {
        const lineRow = lineItemToRow(record.recordId, index, record.lineItems[index]);
        await tx.execute(INSERT_LINE_SQL, [
          lineRow.record_id,
          lineRow.position,
          lineRow.description,
          lineRow.quantity,
          lineRow.unit_price,
        ]);
      }
    }
  });
}

export const paymentRecordRepository = {
  list: listPaymentRecords,
  replaceAll: replaceAllPaymentRecords,
};
