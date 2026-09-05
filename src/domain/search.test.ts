import { describe, expect, it } from "vitest";
import { toMoney } from "./money";
import { searchAppEntities } from "./search";
import type { Student } from "./student";
import type { PaymentRecord } from "./payment-record";
import type { Course } from "./course";
import type { ClassGroup } from "./group";

const students: Student[] = [
  {
    studentId: "C001",
    guardianFirstName: "Ana",
    guardianLastName: "Lopez",
    studentName: "Maria Lopez",
    guardianTaxId: "12345678A",
    enrolledAt: "2025-01-01",
    status: "active",
  },
];

const paymentRecords: PaymentRecord[] = [
  {
    recordId: "F-2025-003",
    issuedOn: "2025-03-01",
    studentId: "C001",
    payerName: "Maria Lopez",
    lineItems: [],
    total: toMoney(40),
    status: "paid",
  },
];

const courses: Course[] = [
  {
    courseId: "P001",
    courseName: "Ingles B2",
    monthlyFee: toMoney(45),
    billingType: "monthly",
    status: "active",
    createdAt: "2025-01-01",
  },
];

const classGroups: ClassGroup[] = [
  {
    classGroupId: "G001",
    name: "Ingles Tarde",
    courseId: "P001",
    weekdays: ["Lunes"],
    startTime: "16:00",
    endTime: "17:00",
    colorClass: "bg-blue-500",
    status: "active",
  },
];

describe("searchAppEntities", () => {
  it("finds students by partial name", () => {
    const results = searchAppEntities("Mar", {
      students,
      paymentRecords,
      courses,
      classGroups,
    });
    expect(results.some((item) => item.kind === "student")).toBe(true);
    expect(results.some((item) => item.kind === "payment")).toBe(true);
  });

  it("finds payment records by id", () => {
    const results = searchAppEntities("F-2025-003", {
      students,
      paymentRecords,
      courses,
      classGroups,
    });
    expect(results[0]?.kind).toBe("payment");
    expect(results[0]?.title).toBe("F-2025-003");
  });

  it("returns empty for blank queries", () => {
    expect(searchAppEntities("  ", { students, paymentRecords, courses, classGroups })).toEqual([]);
  });
});
