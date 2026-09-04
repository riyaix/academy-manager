import type { ClassGroup } from "./group";
import type { Course } from "./course";
import type { Enrollment } from "./enrollment";
import type { PaymentLineItem } from "./payment-record";
import type { Student } from "./student";
import { guardianDisplayName, studentDisplayName } from "./student";
import type { Money } from "./money";
import { addMoney, fromMoney } from "./money";

export type BatchPaymentDraft = {
  student: Student;
  lineItems: PaymentLineItem[];
  total: Money;
};

/** Pure batch builder: group active enrollments by guardian tax id for a billing period. */
export function buildBatchPaymentRecords(input: {
  billingPeriod: string;
  selectedGroupIds: string[];
  enrollments: Enrollment[];
  classGroups: ClassGroup[];
  courses: Course[];
  students: Student[];
}): BatchPaymentDraft[] {
  const { billingPeriod, selectedGroupIds, enrollments, classGroups, courses, students } = input;
  if (selectedGroupIds.length === 0) return [];

  const selectedGroups = new Set(selectedGroupIds);
  const drafts = new Map<string, BatchPaymentDraft>();

  for (const enrollment of enrollments) {
    if (enrollment.status !== "active" || !selectedGroups.has(enrollment.classGroupId)) continue;

    const group = classGroups.find((item) => item.classGroupId === enrollment.classGroupId);
    const course = group
      ? courses.find((item) => item.courseId === group.courseId)
      : undefined;
    const student = students.find((item) => item.studentId === enrollment.studentId);
    if (!group || !course || !student) continue;

    const familyKey = student.guardianTaxId?.trim() || student.studentId;
    const lineItem: PaymentLineItem = {
      description: `Cuota ${billingPeriod} - ${group.name} (${studentDisplayName(student)})`,
      quantity: 1,
      unitPrice: course.monthlyFee,
    };

    const existing = drafts.get(familyKey);
    if (existing) {
      existing.lineItems.push(lineItem);
      existing.total = addMoney(existing.total, course.monthlyFee);
    } else {
      drafts.set(familyKey, {
        student,
        lineItems: [lineItem],
        total: course.monthlyFee,
      });
    }
  }

  return Array.from(drafts.values());
}

export function resolvePayerName(student: Student): string {
  return guardianDisplayName(student);
}

export function lineItemEuroAmount(line: PaymentLineItem): number {
  return fromMoney(line.unitPrice) * line.quantity;
}
