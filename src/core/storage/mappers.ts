import type { ClassGroup } from "../../domain/group";
import { fromMoney, toMoney } from "../../domain/money";
import type { Course } from "../../domain/course";
import type { Enrollment } from "../../domain/enrollment";
import type { PaymentLineItem, PaymentRecord } from "../../domain/payment-record";
import type { Student } from "../../domain/student";
import type { LegacyWeekday } from "../../domain/shared";

export type StudentRow = {
  student_id: string;
  guardian_tax_id: string | null;
  guardian_first_name: string;
  guardian_last_name: string;
  street_type: string | null;
  street_name: string | null;
  street_number: string | null;
  unit_abbreviation: string | null;
  unit_number: string | null;
  floor_number: string | null;
  floor_letter: string | null;
  formatted_address: string | null;
  formatted_unit: string | null;
  postal_code: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  student_name: string | null;
  age: string | null;
  enrolled_at: string;
  status: Student["status"];
  notes: string | null;
};

export type CourseRow = {
  course_id: string;
  course_name: string;
  monthly_fee: number;
  billing_type: Course["billingType"];
  status: Course["status"];
  created_at: string;
};

export type ClassGroupRow = {
  class_group_id: string;
  name: string;
  course_id: string;
  weekdays_json: string;
  start_time: string;
  end_time: string;
  color_class: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  status: ClassGroup["status"];
};

export type EnrollmentRow = {
  enrollment_id: string;
  student_id: string;
  class_group_id: string;
  enrolled_at: string;
  status: Enrollment["status"];
  withdrawn_at: string | null;
};

export type PaymentRecordRow = {
  record_id: string;
  issued_on: string;
  student_id: string;
  payer_name: string;
  total: number;
  status: PaymentRecord["status"];
  billing_period: string | null;
  payment_method: string | null;
  group_ids_json: string;
  voided_at: string | null;
};

export type PaymentRecordLineItemRow = {
  id: number;
  record_id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price: number;
};

export function studentToRow(student: Student): StudentRow {
  return {
    student_id: student.studentId,
    guardian_tax_id: student.guardianTaxId ?? null,
    guardian_first_name: student.guardianFirstName,
    guardian_last_name: student.guardianLastName,
    street_type: student.streetType ?? null,
    street_name: student.streetName ?? null,
    street_number: student.streetNumber ?? null,
    unit_abbreviation: student.unitAbbreviation ?? null,
    unit_number: student.unitNumber ?? null,
    floor_number: student.floorNumber ?? null,
    floor_letter: student.floorLetter ?? null,
    formatted_address: student.formattedAddress ?? null,
    formatted_unit: student.formattedUnit ?? null,
    postal_code: student.postalCode ?? null,
    city: student.city ?? null,
    email: student.email ?? null,
    phone: student.phone ?? null,
    student_name: student.studentName ?? null,
    age: student.age === undefined || student.age === null ? null : String(student.age),
    enrolled_at: student.enrolledAt,
    status: student.status,
    notes: student.notes ?? null,
  };
}

export function rowToStudent(row: StudentRow): Student {
  return {
    studentId: row.student_id,
    guardianTaxId: row.guardian_tax_id ?? undefined,
    guardianFirstName: row.guardian_first_name,
    guardianLastName: row.guardian_last_name,
    streetType: row.street_type ?? undefined,
    streetName: row.street_name ?? undefined,
    streetNumber: row.street_number ?? undefined,
    unitAbbreviation: row.unit_abbreviation ?? undefined,
    unitNumber: row.unit_number ?? undefined,
    floorNumber: row.floor_number ?? undefined,
    floorLetter: row.floor_letter ?? undefined,
    formattedAddress: row.formatted_address ?? undefined,
    formattedUnit: row.formatted_unit ?? undefined,
    postalCode: row.postal_code ?? undefined,
    city: row.city ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    studentName: row.student_name ?? undefined,
    age: row.age ?? undefined,
    enrolledAt: row.enrolled_at,
    status: row.status,
    notes: row.notes ?? undefined,
  };
}

export function courseToRow(course: Course): CourseRow {
  return {
    course_id: course.courseId,
    course_name: course.courseName,
    monthly_fee: fromMoney(course.monthlyFee),
    billing_type: course.billingType,
    status: course.status,
    created_at: course.createdAt,
  };
}

export function rowToCourse(row: CourseRow): Course {
  return {
    courseId: row.course_id,
    courseName: row.course_name,
    monthlyFee: toMoney(row.monthly_fee),
    billingType: row.billing_type,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function classGroupToRow(group: ClassGroup): ClassGroupRow {
  return {
    class_group_id: group.classGroupId,
    name: group.name,
    course_id: group.courseId,
    weekdays_json: JSON.stringify(group.weekdays),
    start_time: group.startTime,
    end_time: group.endTime,
    color_class: group.colorClass,
    start_date: group.startDate ?? null,
    end_date: group.endDate ?? null,
    capacity: group.capacity ?? null,
    status: group.status,
  };
}

function parseWeekdaysJson(raw: string): LegacyWeekday[] {
  try {
    const parsed = JSON.parse(raw) as LegacyWeekday[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rowToClassGroup(row: ClassGroupRow): ClassGroup {
  const weekdays = parseWeekdaysJson(row.weekdays_json);

  return {
    classGroupId: row.class_group_id,
    name: row.name,
    courseId: row.course_id,
    weekdays,
    startTime: row.start_time,
    endTime: row.end_time,
    colorClass: row.color_class,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    capacity: row.capacity ?? undefined,
    status: row.status,
  };
}

export function enrollmentToRow(enrollment: Enrollment): EnrollmentRow {
  return {
    enrollment_id: enrollment.enrollmentId,
    student_id: enrollment.studentId,
    class_group_id: enrollment.classGroupId,
    enrolled_at: enrollment.enrolledAt,
    status: enrollment.status,
    withdrawn_at: enrollment.withdrawnAt ?? null,
  };
}

export function rowToEnrollment(row: EnrollmentRow): Enrollment {
  return {
    enrollmentId: row.enrollment_id,
    studentId: row.student_id,
    classGroupId: row.class_group_id,
    enrolledAt: row.enrolled_at,
    status: row.status,
    withdrawnAt: row.withdrawn_at ?? undefined,
  };
}

export function paymentRecordToRow(record: PaymentRecord): PaymentRecordRow {
  return {
    record_id: record.recordId,
    issued_on: record.issuedOn,
    student_id: record.studentId,
    payer_name: record.payerName,
    total: fromMoney(record.total),
    status: record.status,
    billing_period: record.billingPeriod ?? null,
    payment_method: record.paymentMethod ?? null,
    group_ids_json: JSON.stringify(record.groupIds ?? []),
    voided_at: record.voidedAt ?? null,
  };
}

export function lineItemToRow(
  recordId: string,
  position: number,
  line: PaymentLineItem,
): Omit<PaymentRecordLineItemRow, "id"> {
  return {
    record_id: recordId,
    position,
    description: line.description,
    quantity: line.quantity,
    unit_price: fromMoney(line.unitPrice),
  };
}

export function rowToPaymentRecord(
  row: PaymentRecordRow,
  lineItems: PaymentLineItem[],
): PaymentRecord {
  let groupIds: PaymentRecord["groupIds"];
  try {
    const parsed = JSON.parse(row.group_ids_json) as string[];
    groupIds = Array.isArray(parsed) ? parsed : [];
  } catch {
    groupIds = [];
  }

  return {
    recordId: row.record_id,
    issuedOn: row.issued_on,
    studentId: row.student_id,
    payerName: row.payer_name,
    lineItems,
    total: toMoney(row.total),
    status: row.status,
    billingPeriod: row.billing_period ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    groupIds,
    voidedAt: row.voided_at ?? undefined,
  };
}
