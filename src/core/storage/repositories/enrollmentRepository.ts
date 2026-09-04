import type { Enrollment } from "../../../domain/enrollment";
import { TABLE_NAMES } from "../constants";
import { getDatabase } from "../database";
import { enrollmentToRow, rowToEnrollment, type EnrollmentRow } from "../mappers";
import { runInTransaction } from "../sql";

const INSERT_ENROLLMENT_SQL = `INSERT INTO ${TABLE_NAMES.enrollments} (
  enrollment_id, student_id, class_group_id, enrolled_at, status, withdrawn_at
) VALUES ($1, $2, $3, $4, $5, $6)`;

export async function listEnrollments(): Promise<Enrollment[]> {
  const db = await getDatabase();
  const rows = await db.select<EnrollmentRow[]>(
    `SELECT * FROM ${TABLE_NAMES.enrollments} ORDER BY enrolled_at DESC, enrollment_id ASC`,
  );
  return rows.map(rowToEnrollment);
}

export async function replaceAllEnrollments(enrollments: Enrollment[]): Promise<void> {
  const db = await getDatabase();
  await runInTransaction(db, async (tx) => {
    await tx.execute(`DELETE FROM ${TABLE_NAMES.enrollments}`);
    for (const enrollment of enrollments) {
      const row = enrollmentToRow(enrollment);
      await tx.execute(INSERT_ENROLLMENT_SQL, [
        row.enrollment_id,
        row.student_id,
        row.class_group_id,
        row.enrolled_at,
        row.status,
        row.withdrawn_at,
      ]);
    }
  });
}

export const enrollmentRepository = {
  list: listEnrollments,
  replaceAll: replaceAllEnrollments,
};
