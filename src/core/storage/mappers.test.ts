import { describe, expect, it } from "vitest";
import type { Student } from "../../domain/student";
import { rowToStudent, studentToRow } from "./mappers";

describe("student row mappers", () => {
  const student: Student = {
    studentId: "C001",
    guardianFirstName: "Ana",
    guardianLastName: "Garcia",
    enrolledAt: "2026-01-15",
    status: "active",
    age: 12,
    guardianTaxId: "12345678Z",
  };

  it("round-trips domain students through sqlite rows", () => {
    const row = studentToRow(student);
    expect(row.age).toBe("12");
    expect(rowToStudent(row)).toMatchObject({
      ...student,
      age: "12",
    });
  });
});
