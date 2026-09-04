import type { ClassGroup } from "./group";
import type { Course } from "./course";
import type { Enrollment } from "./enrollment";

export type StudentCourseHistoryEntry = {
  year: number;
  courseLabel: string;
  status: Enrollment["status"];
};

/** Derive a student's course history from enrollments and class groups. */
export function buildStudentCourseHistory(
  studentId: string,
  enrollments: Enrollment[],
  classGroups: ClassGroup[],
  courses: Course[],
): StudentCourseHistoryEntry[] {
  return enrollments
    .filter((enrollment) => enrollment.studentId === studentId)
    .map((enrollment) => {
      const group = classGroups.find((item) => item.classGroupId === enrollment.classGroupId);
      const course = group
        ? courses.find((item) => item.courseId === group.courseId)
        : undefined;
      const year = enrollment.enrolledAt
        ? new Date(enrollment.enrolledAt).getFullYear()
        : new Date().getFullYear();

      const courseName = course?.courseName ?? "Curso";
      const groupName = group?.name ?? "Grupo";

      return {
        year,
        courseLabel: `${courseName} - ${groupName}`,
        status: enrollment.status,
      };
    })
    .sort((left, right) => right.year - left.year);
}
