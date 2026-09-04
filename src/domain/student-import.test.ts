import { describe, expect, it } from "vitest";
import {
  applyStudentImport,
  buildStudentImportPreview,
  guessStudentColumnMapping,
} from "./student-import";
import type { Student } from "./student";

const existing: Student[] = [
  {
    studentId: "C001",
    guardianFirstName: "Ana",
    guardianLastName: "Lopez",
    guardianTaxId: "12345678A",
    enrolledAt: "2025-01-01",
    status: "active",
  },
];

describe("guessStudentColumnMapping", () => {
  it("maps common Spanish and English headers", () => {
    const mapping = guessStudentColumnMapping([
      "Nombre",
      "Apellidos",
      "DNI",
      "Alumno",
      "Email",
      "Teléfono",
    ]);
    expect(mapping.Nombre).toBe("guardianFirstName");
    expect(mapping.Apellidos).toBe("guardianLastName");
    expect(mapping.DNI).toBe("guardianTaxId");
    expect(mapping.Alumno).toBe("studentName");
    expect(mapping.Email).toBe("email");
    expect(mapping.Teléfono).toBe("phone");
  });
});

describe("buildStudentImportPreview + applyStudentImport", () => {
  const headers = ["Nombre", "Apellidos", "DNI", "Alumno"];
  const mapping = guessStudentColumnMapping(headers);

  it("flags missing names and duplicates", () => {
    const preview = buildStudentImportPreview(
      headers,
      [
        { Nombre: "Ana", Apellidos: "Lopez", DNI: "12345678A", Alumno: "Pedro" },
        { Nombre: "", Apellidos: "Ruiz", DNI: "", Alumno: "" },
        { Nombre: "Luis", Apellidos: "Garcia", DNI: "87654321B", Alumno: "Marta" },
      ],
      mapping,
      existing,
    );

    expect(preview[0].issues.some((issue) => issue.reason === "duplicate_tax_id")).toBe(true);
    expect(preview[1].issues.some((issue) => issue.reason === "missing_name")).toBe(true);
    expect(preview[2].issues).toHaveLength(0);
  });

  it("creates new students and can skip duplicates", () => {
    const preview = buildStudentImportPreview(
      headers,
      [
        { Nombre: "Ana", Apellidos: "Lopez", DNI: "12345678A", Alumno: "Pedro" },
        { Nombre: "Luis", Apellidos: "Garcia", DNI: "87654321B", Alumno: "Marta" },
      ],
      mapping,
      existing,
    );

    const result = applyStudentImport(existing, preview, "skip_duplicates");
    expect(result.created).toHaveLength(1);
    expect(result.created[0].studentId).toBe("C002");
    expect(result.skipped).toHaveLength(1);
    expect(result.updated).toHaveLength(0);
  });

  it("updates duplicates when requested", () => {
    const preview = buildStudentImportPreview(
      headers,
      [{ Nombre: "Ana", Apellidos: "Lopez", DNI: "12345678A", Alumno: "Pedro Nuevo" }],
      mapping,
      existing,
    );

    const result = applyStudentImport(existing, preview, "update_duplicates");
    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].studentName).toBe("Pedro Nuevo");
    expect(result.created).toHaveLength(0);
  });
});
