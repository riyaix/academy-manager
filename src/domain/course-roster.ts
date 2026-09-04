import type { ClassGroup } from "./group";
import type { Course } from "./course";
import type { Enrollment, EnrollmentStatus } from "./enrollment";
import type { Student } from "./student";
import { studentDisplayName } from "./student";

export type CourseStudentRosterEntry = Student & {
  enrollmentStatus: EnrollmentStatus;
  lastClassDate?: string;
};

export type CourseStudentRoster = {
  active: CourseStudentRosterEntry[];
  historic: CourseStudentRosterEntry[];
};

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function compareStudentsByName(left: Student, right: Student): number {
  return studentDisplayName(left).localeCompare(studentDisplayName(right), "es");
}

/** Active and withdrawn students enrolled in any group for the given course. */
export function buildCourseStudentRoster(
  courseId: Course["courseId"],
  enrollments: Enrollment[],
  classGroups: ClassGroup[],
  students: Student[],
): CourseStudentRoster {
  const groupIds = new Set(
    classGroups.filter((group) => group.courseId === courseId).map((group) => group.classGroupId),
  );

  const enrollmentsByStudent = new Map<string, Enrollment[]>();
  for (const enrollment of enrollments) {
    if (!groupIds.has(enrollment.classGroupId)) continue;
    const existing = enrollmentsByStudent.get(enrollment.studentId) ?? [];
    existing.push(enrollment);
    enrollmentsByStudent.set(enrollment.studentId, existing);
  }

  const active: CourseStudentRosterEntry[] = [];
  const historic: CourseStudentRosterEntry[] = [];

  for (const [studentId, studentEnrollments] of enrollmentsByStudent) {
    const student = students.find((item) => item.studentId === studentId);
    if (!student) continue;

    const activeEnrollment = studentEnrollments.find((item) => item.status === "active");
    if (activeEnrollment) {
      active.push({ ...student, enrollmentStatus: "active" });
      continue;
    }

    const withdrawnEnrollment = [...studentEnrollments]
      .filter((item) => item.status !== "active")
      .sort((left, right) =>
        (right.withdrawnAt ?? right.enrolledAt).localeCompare(
          left.withdrawnAt ?? left.enrolledAt,
        ),
      )[0];

    if (!withdrawnEnrollment) continue;

    const lastDate = withdrawnEnrollment.withdrawnAt ?? withdrawnEnrollment.enrolledAt;
    historic.push({
      ...student,
      enrollmentStatus: withdrawnEnrollment.status,
      lastClassDate: formatDisplayDate(lastDate),
    });
  }

  return {
    active: active.sort(compareStudentsByName),
    historic: historic.sort(compareStudentsByName),
  };
}
