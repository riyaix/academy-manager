import { describe, expect, it } from "vitest";
import { buildBatchPaymentRecords, resolvePayerName } from "./billing-batch";
import type { ClassGroup } from "./group";
import type { Student } from "./student";
import { fromMoney, toMoney } from "./money";

describe("buildBatchPaymentRecords", () => {
  const students: Student[] = [
    {
      studentId: "C001",
      guardianTaxId: "12345678A",
      guardianFirstName: "Ana",
      guardianLastName: "Lopez",
      studentName: "Pedro Lopez",
      enrolledAt: "2025-01-01",
      status: "active",
    },
    {
      studentId: "C002",
      guardianTaxId: "12345678A",
      guardianFirstName: "Ana",
      guardianLastName: "Lopez",
      studentName: "Maria Lopez",
      enrolledAt: "2025-01-01",
      status: "active",
    },
  ];

  it("groups siblings with the same tax id into one draft", () => {
    const drafts = buildBatchPaymentRecords({
      billingPeriod: "Marzo 2026",
      selectedGroupIds: ["G001"],
      enrollments: [
        {
          enrollmentId: "M1",
          studentId: "C001",
          classGroupId: "G001",
          enrolledAt: "2025-09-01",
          status: "active",
        },
        {
          enrollmentId: "M2",
          studentId: "C002",
          classGroupId: "G001",
          enrolledAt: "2025-09-01",
          status: "active",
        },
      ],
      classGroups: [
        {
          classGroupId: "G001",
          name: "Grupo Tarde",
          courseId: "P001",
          weekdays: ["Lunes"],
          startTime: "16:00",
          endTime: "17:00",
          colorClass: "bg-blue-500",
          status: "active",
        },
      ],
      courses: [
        {
          courseId: "P001",
          courseName: "Ingles B2",
          monthlyFee: toMoney(45),
          billingType: "monthly",
          status: "active",
          createdAt: "2024-01-01",
        },
      ],
      students,
    });

    expect(drafts).toHaveLength(1);
    expect(drafts[0].lineItems).toHaveLength(2);
    expect(fromMoney(drafts[0].total)).toBe(90);
  });
});

describe("resolvePayerName", () => {
  it("prefers guardian name over student name", () => {
    expect(
      resolvePayerName({
        studentId: "C001",
        guardianFirstName: "Ana",
        guardianLastName: "Ruiz",
        studentName: "Luis Ruiz",
        enrolledAt: "2025-01-01",
        status: "active",
      }),
    ).toBe("Ana Ruiz");
  });

  it("falls back to student name when guardian name is missing", () => {
    expect(
      resolvePayerName({
        studentId: "C001",
        guardianFirstName: "",
        guardianLastName: "",
        studentName: "Luis Ruiz",
        enrolledAt: "2025-01-01",
        status: "active",
      }),
    ).toBe("Luis Ruiz");
  });
});

describe("buildBatchPaymentRecords edge cases", () => {
  const baseInput = {
    billingPeriod: "Marzo 2026",
    selectedGroupIds: ["G001"],
    enrollments: [
      {
        enrollmentId: "M1",
        studentId: "C001",
        classGroupId: "G001",
        enrolledAt: "2025-09-01",
        status: "active" as const,
      },
    ],
    classGroups: [
      {
        classGroupId: "G001",
        name: "Grupo Tarde",
        courseId: "P001",
        weekdays: ["Lunes"],
        startTime: "16:00",
        endTime: "17:00",
        colorClass: "bg-blue-500",
        status: "active",
      },
    ] satisfies ClassGroup[],
    courses: [
      {
        courseId: "P001",
        courseName: "Ingles B2",
        monthlyFee: toMoney(45),
        billingType: "monthly" as const,
        status: "active" as const,
        createdAt: "2024-01-01",
      },
    ],
    students: [
      {
        studentId: "C001",
        guardianTaxId: "11111111A",
        guardianFirstName: "Ana",
        guardianLastName: "Lopez",
        studentName: "Pedro",
        enrolledAt: "2025-01-01",
        status: "active" as const,
      },
      {
        studentId: "C002",
        guardianTaxId: "22222222B",
        guardianFirstName: "Luis",
        guardianLastName: "Garcia",
        studentName: "Marta",
        enrolledAt: "2025-01-01",
        status: "active" as const,
      },
    ] satisfies Student[],
  };

  it("returns empty array when no groups are selected", () => {
    expect(buildBatchPaymentRecords({ ...baseInput, selectedGroupIds: [] })).toEqual([]);
  });

  it("skips inactive enrollments", () => {
    const drafts = buildBatchPaymentRecords({
      ...baseInput,
      enrollments: [
        {
          enrollmentId: "M1",
          studentId: "C001",
          classGroupId: "G001",
          enrolledAt: "2025-09-01",
          status: "inactive",
        },
      ],
    });
    expect(drafts).toHaveLength(0);
  });

  it("creates separate drafts for different tax ids", () => {
    const drafts = buildBatchPaymentRecords({
      ...baseInput,
      enrollments: [
        {
          enrollmentId: "M1",
          studentId: "C001",
          classGroupId: "G001",
          enrolledAt: "2025-09-01",
          status: "active",
        },
        {
          enrollmentId: "M2",
          studentId: "C002",
          classGroupId: "G001",
          enrolledAt: "2025-09-01",
          status: "active",
        },
      ],
    });
    expect(drafts).toHaveLength(2);
    expect(drafts.map((draft) => draft.student.studentId).sort()).toEqual(["C001", "C002"]);
  });

  it("uses student code when tax id is missing", () => {
    const drafts = buildBatchPaymentRecords({
      ...baseInput,
      students: [{ ...baseInput.students[0], guardianTaxId: "" }],
    });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].student.studentId).toBe("C001");
  });
});
