import { TABLE_NAMES } from "../constants";
import { getDatabase } from "../database";
import { runInTransaction } from "../sql";

type PaymentMethodRow = {
  position: number;
  label: string;
};

export async function listPaymentMethods(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.select<PaymentMethodRow[]>(
    `SELECT position, label FROM ${TABLE_NAMES.paymentMethods} ORDER BY position ASC`,
  );
  return rows.map((row) => row.label);
}

export async function replaceAllPaymentMethods(methods: string[]): Promise<void> {
  const db = await getDatabase();
  await runInTransaction(db, async (tx) => {
    await tx.execute(`DELETE FROM ${TABLE_NAMES.paymentMethods}`);
    for (let index = 0; index < methods.length; index++) {
      await tx.execute(
        `INSERT INTO ${TABLE_NAMES.paymentMethods} (position, label) VALUES ($1, $2)`,
        [index, methods[index]],
      );
    }
  });
}

export const paymentMethodRepository = {
  list: listPaymentMethods,
  replaceAll: replaceAllPaymentMethods,
};
