import { describe, expect, it } from "vitest";
import { toMoney } from "./money";
import { buildStudentCourseHistory } from "./enrollment-history";

describe("buildStudentCourseHistory", () => {
  it("derives course rows from enrollments and groups", () => {
    const history = buildStudentCourseHistory(
      "C001",
      [
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
          classGroupId: "G002",
          enrolledAt: "2024-09-01",
          status: "inactive",
        },
      ],
      [
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
      [
        {
          courseId: "P001",
          courseName: "Ingles B2",
          monthlyFee: toMoney(45),
          billingType: "monthly",
          status: "active",
          createdAt: "2024-01-01",
        },
      ],
    );

    expect(history).toHaveLength(1);
    expect(history[0].courseLabel).toBe("Ingles B2 - Grupo Tarde");
    expect(history[0].year).toBe(2025);
  });
});
