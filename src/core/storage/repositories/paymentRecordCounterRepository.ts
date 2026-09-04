import { TABLE_NAMES } from "../constants";
import { getDatabase } from "../database";
import { runInTransaction } from "../sql";

type CounterRow = {
  year: number;
  last_sequence: number;
};

export async function loadPaymentRecordCounters(): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.select<CounterRow[]>(
    `SELECT year, last_sequence FROM ${TABLE_NAMES.paymentRecordCounters}`,
  );

  const counters: Record<string, number> = {};
  for (const row of rows) {
    counters[String(row.year)] = row.last_sequence;
  }
  return counters;
}

export async function replaceAllPaymentRecordCounters(
  counters: Record<string, number>,
): Promise<void> {
  const db = await getDatabase();
  await runInTransaction(db, async (tx) => {
    await tx.execute(`DELETE FROM ${TABLE_NAMES.paymentRecordCounters}`);
    for (const [year, lastSequence] of Object.entries(counters)) {
      const parsedYear = Number(year);
      if (!Number.isFinite(parsedYear)) continue;
      await tx.execute(
        `INSERT INTO ${TABLE_NAMES.paymentRecordCounters} (year, last_sequence) VALUES ($1, $2)`,
        [parsedYear, lastSequence],
      );
    }
  });
}

export const paymentRecordCounterRepository = {
  load: loadPaymentRecordCounters,
  replaceAll: replaceAllPaymentRecordCounters,
};
