import type { Enrollment } from "./enrollment";

export function countActiveEnrollmentsInGroup(groupId: string, enrollments: Enrollment[]): number {
  return enrollments.filter(
    (enrollment) => enrollment.classGroupId === groupId && enrollment.status === "active",
  ).length;
}

export function isStudentActiveInGroup(
  studentId: string,
  groupId: string,
  enrollments: Enrollment[],
): boolean {
  return enrollments.some(
    (enrollment) =>
      enrollment.studentId === studentId &&
      enrollment.classGroupId === groupId &&
      enrollment.status === "active",
  );
}

export function isGroupAtCapacity(
  groupId: string,
  capacity: number | string | undefined,
  enrollments: Enrollment[],
): boolean {
  if (capacity === undefined || capacity === "" || capacity === null) return false;
  const max = typeof capacity === "string" ? Number.parseInt(capacity, 10) : capacity;
  if (!Number.isFinite(max) || max <= 0) return false;
  return countActiveEnrollmentsInGroup(groupId, enrollments) >= max;
}
