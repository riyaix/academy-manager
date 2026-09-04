import type { Course } from "../../../domain/course";
import { TABLE_NAMES } from "../constants";
import { getDatabase } from "../database";
import { courseToRow, rowToCourse, type CourseRow } from "../mappers";
import { runInTransaction } from "../sql";

const INSERT_COURSE_SQL = `INSERT INTO ${TABLE_NAMES.courses} (
  course_id, course_name, monthly_fee, billing_type, status, created_at
) VALUES ($1, $2, $3, $4, $5, $6)`;

export async function listCourses(): Promise<Course[]> {
  const db = await getDatabase();
  const rows = await db.select<CourseRow[]>(
    `SELECT * FROM ${TABLE_NAMES.courses} ORDER BY created_at DESC, course_id ASC`,
  );
  return rows.map(rowToCourse);
}

export async function replaceAllCourses(courses: Course[]): Promise<void> {
  const db = await getDatabase();
  await runInTransaction(db, async (tx) => {
    await tx.execute(`DELETE FROM ${TABLE_NAMES.courses}`);
    for (const course of courses) {
      const row = courseToRow(course);
      await tx.execute(INSERT_COURSE_SQL, [
        row.course_id,
        row.course_name,
        row.monthly_fee,
        row.billing_type,
        row.status,
        row.created_at,
      ]);
    }
  });
}

export const courseRepository = {
  list: listCourses,
  replaceAll: replaceAllCourses,
};
