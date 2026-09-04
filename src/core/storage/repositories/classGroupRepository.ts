import type { ClassGroup } from "../../../domain/group";
import { TABLE_NAMES } from "../constants";
import { getDatabase } from "../database";
import { classGroupToRow, rowToClassGroup, type ClassGroupRow } from "../mappers";
import { runInTransaction } from "../sql";

const INSERT_CLASS_GROUP_SQL = `INSERT INTO ${TABLE_NAMES.classGroups} (
  class_group_id, name, course_id, weekdays_json, start_time, end_time,
  color_class, start_date, end_date, capacity, status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

export async function listClassGroups(): Promise<ClassGroup[]> {
  const db = await getDatabase();
  const rows = await db.select<ClassGroupRow[]>(
    `SELECT * FROM ${TABLE_NAMES.classGroups} ORDER BY name ASC, class_group_id ASC`,
  );
  return rows.map(rowToClassGroup);
}

export async function replaceAllClassGroups(groups: ClassGroup[]): Promise<void> {
  const db = await getDatabase();
  await runInTransaction(db, async (tx) => {
    await tx.execute(`DELETE FROM ${TABLE_NAMES.classGroups}`);
    for (const group of groups) {
      const row = classGroupToRow(group);
      await tx.execute(INSERT_CLASS_GROUP_SQL, [
        row.class_group_id,
        row.name,
        row.course_id,
        row.weekdays_json,
        row.start_time,
        row.end_time,
        row.color_class,
        row.start_date,
        row.end_date,
        row.capacity,
        row.status,
      ]);
    }
  });
}

export const classGroupRepository = {
  list: listClassGroups,
  replaceAll: replaceAllClassGroups,
};
