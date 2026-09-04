import { nextPrefixedId } from "./ids";
import type { Student, StudentStatus } from "./student";

/** Columns the importer can map spreadsheet headers onto. */
export type StudentImportField =
  | "guardianFirstName"
  | "guardianLastName"
  | "guardianTaxId"
  | "studentName"
  | "email"
  | "phone"
  | "postalCode"
  | "city"
  | "age"
  | "enrolledAt"
  | "status"
  | "notes"
  | "skip";

export type StudentColumnMapping = Record<string, StudentImportField>;

export type StudentImportRowIssue = {
  rowNumber: number;
  reason: "missing_name" | "duplicate_tax_id" | "duplicate_name";
  matchedStudentId?: string;
};

export type StudentImportPreviewRow = {
  rowNumber: number;
  draft: Omit<Student, "studentId">;
  issues: StudentImportRowIssue[];
};

export type StudentImportResult = {
  students: Student[];
  created: Student[];
  skipped: StudentImportPreviewRow[];
  updated: Student[];
};

const HEADER_ALIASES: Record<StudentImportField, string[]> = {
  guardianFirstName: [
    "nombre",
    "name",
    "firstname",
    "first_name",
    "guardianfirstname",
    "nombre tutor",
    "nombre padre",
  ],
  guardianLastName: [
    "apellidos",
    "apellido",
    "lastname",
    "last_name",
    "surname",
    "guardianlastname",
  ],
  guardianTaxId: ["dni", "nif", "nie", "taxid", "tax_id", "cif", "guardiantaxid"],
  studentName: ["alumno", "alumna", "student", "studentname", "student_name", "nombre alumno"],
  email: ["email", "e-mail", "correo", "mail"],
  phone: ["telefono", "teléfono", "phone", "mobile", "movil", "móvil"],
  postalCode: ["cp", "c.p.", "postalcode", "postal_code", "zip", "codigo postal", "código postal"],
  city: ["ciudad", "city", "localidad", "town"],
  age: ["edad", "age"],
  enrolledAt: ["fecha alta", "fechaalta", "enrolledat", "enrolled_at", "alta", "fecha"],
  status: ["estado", "status"],
  notes: ["notas", "notes", "observaciones", "comments"],
  skip: [],
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function guessStudentColumnMapping(headers: string[]): StudentColumnMapping {
  const mapping: StudentColumnMapping = {};
  const used = new Set<StudentImportField>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    let matched: StudentImportField = "skip";

    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
      [StudentImportField, string[]]
    >) {
      if (field === "skip" || used.has(field)) continue;
      if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
        matched = field;
        used.add(field);
        break;
      }
    }

    mapping[header] = matched;
  }

  return mapping;
}

function cellValue(
  row: Record<string, string>,
  headers: string[],
  mapping: StudentColumnMapping,
  field: StudentImportField,
): string {
  const header = headers.find((item) => mapping[item] === field);
  if (!header) return "";
  return (row[header] ?? "").trim();
}

function parseStatus(value: string): StudentStatus {
  const normalized = normalizeHeader(value);
  if (
    normalized === "inactive" ||
    normalized === "inactivo" ||
    normalized === "baja" ||
    normalized === "archivado"
  ) {
    return "inactive";
  }
  return "active";
}

function normalizeTaxId(value: string): string {
  return value.replace(/[\s.\-]/g, "").toUpperCase();
}

function normalizePersonName(value: string): string {
  return normalizeHeader(value);
}

export function findExistingStudentMatch(
  draft: Omit<Student, "studentId">,
  existing: Student[],
): Student | undefined {
  const taxId = draft.guardianTaxId ? normalizeTaxId(draft.guardianTaxId) : "";
  if (taxId) {
    const byTax = existing.find(
      (student) =>
        student.guardianTaxId && normalizeTaxId(student.guardianTaxId) === taxId,
    );
    if (byTax) return byTax;
  }

  const first = normalizePersonName(draft.guardianFirstName);
  const last = normalizePersonName(draft.guardianLastName);
  if (!first || !last) return undefined;

  return existing.find(
    (student) =>
      normalizePersonName(student.guardianFirstName) === first &&
      normalizePersonName(student.guardianLastName) === last,
  );
}

export function buildStudentImportPreview(
  headers: string[],
  rows: Record<string, string>[],
  mapping: StudentColumnMapping,
  existingStudents: Student[],
): StudentImportPreviewRow[] {
  const today = new Date().toISOString().slice(0, 10);

  return rows.map((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const draft: Omit<Student, "studentId"> = {
      guardianFirstName: cellValue(row, headers, mapping, "guardianFirstName"),
      guardianLastName: cellValue(row, headers, mapping, "guardianLastName"),
      guardianTaxId: cellValue(row, headers, mapping, "guardianTaxId") || undefined,
      studentName: cellValue(row, headers, mapping, "studentName") || undefined,
      email: cellValue(row, headers, mapping, "email") || undefined,
      phone: cellValue(row, headers, mapping, "phone") || undefined,
      postalCode: cellValue(row, headers, mapping, "postalCode") || undefined,
      city: cellValue(row, headers, mapping, "city") || undefined,
      age: cellValue(row, headers, mapping, "age") || undefined,
      enrolledAt: cellValue(row, headers, mapping, "enrolledAt") || today,
      status: parseStatus(cellValue(row, headers, mapping, "status")),
      notes: cellValue(row, headers, mapping, "notes") || undefined,
    };

    const issues: StudentImportRowIssue[] = [];
    if (!draft.guardianFirstName || !draft.guardianLastName) {
      issues.push({ rowNumber, reason: "missing_name" });
    }

    const match = findExistingStudentMatch(draft, existingStudents);
    if (match) {
      issues.push({
        rowNumber,
        reason: draft.guardianTaxId ? "duplicate_tax_id" : "duplicate_name",
        matchedStudentId: match.studentId,
      });
    }

    return { rowNumber, draft, issues };
  });
}

export type StudentImportMode = "skip_duplicates" | "update_duplicates";

/** Apply preview rows into a new students array. */
export function applyStudentImport(
  existingStudents: Student[],
  preview: StudentImportPreviewRow[],
  mode: StudentImportMode,
): StudentImportResult {
  const next = [...existingStudents];
  const created: Student[] = [];
  const updated: Student[] = [];
  const skipped: StudentImportPreviewRow[] = [];

  for (const row of preview) {
    if (row.issues.some((issue) => issue.reason === "missing_name")) {
      skipped.push(row);
      continue;
    }

    const duplicateIssue = row.issues.find(
      (issue) => issue.reason === "duplicate_tax_id" || issue.reason === "duplicate_name",
    );

    if (duplicateIssue?.matchedStudentId) {
      if (mode === "skip_duplicates") {
        skipped.push(row);
        continue;
      }

      const index = next.findIndex(
        (student) => student.studentId === duplicateIssue.matchedStudentId,
      );
      if (index >= 0) {
        const merged: Student = {
          ...next[index],
          ...row.draft,
          studentId: next[index].studentId,
        };
        next[index] = merged;
        updated.push(merged);
      }
      continue;
    }

    const student: Student = {
      ...row.draft,
      studentId: nextPrefixedId(
        "C",
        3,
        next.map((item) => item.studentId),
      ),
    };
    next.push(student);
    created.push(student);
  }

  return { students: next, created, skipped, updated };
}
