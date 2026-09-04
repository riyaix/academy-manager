import type { ClassGroup } from "./group";
import type { Course } from "./course";
import type { PaymentRecord } from "./payment-record";
import type { Student } from "./student";
import { guardianDisplayName, studentDisplayName } from "./student";

export type GlobalSearchResultKind = "student" | "payment" | "course" | "group";

export type GlobalSearchResult = {
  id: string;
  kind: GlobalSearchResultKind;
  title: string;
  subtitle: string;
  /** Navigation view id. */
  viewId: "students" | "payment-history" | "courses" | "groups";
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function matches(haystack: string | undefined, needle: string): boolean {
  if (!haystack || !needle) return false;
  return normalizeQuery(haystack).includes(needle);
}

/** Fuzzy-enough substring search across academy entities for the Ctrl+K palette. */
export function searchAppEntities(
  query: string,
  input: {
    students: Student[];
    paymentRecords: PaymentRecord[];
    courses: Course[];
    classGroups: ClassGroup[];
  },
  limit = 20,
): GlobalSearchResult[] {
  const needle = normalizeQuery(query);
  if (!needle) return [];

  const results: GlobalSearchResult[] = [];

  for (const student of input.students) {
    if (
      matches(student.studentId, needle) ||
      matches(student.guardianTaxId, needle) ||
      matches(student.guardianFirstName, needle) ||
      matches(student.guardianLastName, needle) ||
      matches(student.studentName, needle) ||
      matches(guardianDisplayName(student), needle)
    ) {
      results.push({
        id: `student:${student.studentId}`,
        kind: "student",
        title: guardianDisplayName(student),
        subtitle: [student.studentName, student.guardianTaxId, student.studentId]
          .filter(Boolean)
          .join(" · "),
        viewId: "students",
      });
    }
  }

  for (const record of input.paymentRecords) {
    if (
      matches(record.recordId, needle) ||
      matches(record.payerName, needle) ||
      matches(record.billingPeriod, needle)
    ) {
      results.push({
        id: `payment:${record.recordId}`,
        kind: "payment",
        title: record.recordId,
        subtitle: [record.payerName, record.billingPeriod].filter(Boolean).join(" · "),
        viewId: "payment-history",
      });
    }
  }

  for (const course of input.courses) {
    if (matches(course.courseId, needle) || matches(course.courseName, needle)) {
      results.push({
        id: `course:${course.courseId}`,
        kind: "course",
        title: course.courseName,
        subtitle: course.courseId,
        viewId: "courses",
      });
    }
  }

  for (const group of input.classGroups) {
    if (matches(group.classGroupId, needle) || matches(group.name, needle)) {
      results.push({
        id: `group:${group.classGroupId}`,
        kind: "group",
        title: group.name,
        subtitle: group.classGroupId,
        viewId: "groups",
      });
    }
  }

  return results.slice(0, limit);
}

export function studentDisplayLabel(student: Student): string {
  return studentDisplayName(student);
}
