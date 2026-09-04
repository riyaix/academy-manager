import type { ActiveStatus, EntityId, ISODate } from "./shared";

export type StudentStatus = ActiveStatus;

/** Guardian + student record stored for academy clients. */
export type Student = {
  studentId: EntityId;
  guardianTaxId?: string;
  guardianFirstName: string;
  guardianLastName: string;
  streetType?: string;
  streetName?: string;
  streetNumber?: string;
  unitAbbreviation?: string;
  unitNumber?: string;
  floorNumber?: string;
  floorLetter?: string;
  formattedAddress?: string;
  formattedUnit?: string;
  postalCode?: string;
  city?: string;
  email?: string;
  phone?: string;
  studentName?: string;
  age?: number | string;
  enrolledAt: ISODate;
  status: StudentStatus;
  notes?: string;
};

export type StudentDraft = Omit<Student, "studentId"> & {
  studentId?: EntityId;
};

export function studentDisplayName(student: Student): string {
  const trimmed = student.studentName?.trim();
  if (trimmed) return trimmed;
  return `${student.guardianFirstName} ${student.guardianLastName}`.trim();
}

export function guardianDisplayName(student: Student): string {
  const name = `${student.guardianFirstName} ${student.guardianLastName}`.trim();
  return name || student.studentName || student.studentId;
}
