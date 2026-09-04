import type { Student } from "../../../domain/student";
import { TABLE_NAMES } from "../constants";
import { getDatabase } from "../database";
import { rowToStudent, studentToRow, type StudentRow } from "../mappers";
import { runInTransaction } from "../sql";

const INSERT_STUDENT_SQL = `INSERT INTO ${TABLE_NAMES.students} (
  student_id, guardian_tax_id, guardian_first_name, guardian_last_name,
  street_type, street_name, street_number, unit_abbreviation, unit_number,
  floor_number, floor_letter, formatted_address, formatted_unit,
  postal_code, city, email, phone, student_name, age, enrolled_at, status, notes
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`;

function studentBindValues(row: ReturnType<typeof studentToRow>) {
  return [
    row.student_id,
    row.guardian_tax_id,
    row.guardian_first_name,
    row.guardian_last_name,
    row.street_type,
    row.street_name,
    row.street_number,
    row.unit_abbreviation,
    row.unit_number,
    row.floor_number,
    row.floor_letter,
    row.formatted_address,
    row.formatted_unit,
    row.postal_code,
    row.city,
    row.email,
    row.phone,
    row.student_name,
    row.age,
    row.enrolled_at,
    row.status,
    row.notes,
  ];
}

export async function listStudents(): Promise<Student[]> {
  const db = await getDatabase();
  const rows = await db.select<StudentRow[]>(
    `SELECT * FROM ${TABLE_NAMES.students} ORDER BY enrolled_at DESC, student_id ASC`,
  );
  return rows.map(rowToStudent);
}

export async function replaceAllStudents(students: Student[]): Promise<void> {
  const db = await getDatabase();
  await runInTransaction(db, async (tx) => {
    await tx.execute(`DELETE FROM ${TABLE_NAMES.students}`);
    for (const student of students) {
      await tx.execute(INSERT_STUDENT_SQL, studentBindValues(studentToRow(student)));
    }
  });
}

export const studentRepository = {
  list: listStudents,
  replaceAll: replaceAllStudents,
};
