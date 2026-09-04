import { describe, expect, it } from "vitest";
import type { ClassGroup } from "./group";
import type { Student } from "./student";
import { buildCourseStudentRoster } from "./course-roster";

describe("buildCourseStudentRoster", () => {
  const students: Student[] = [
    {
      studentId: "C001",
      guardianFirstName: "Ana",
      guardianLastName: "Garcia",
      enrolledAt: "2024-09-01",
      status: "active",
    },
    {
      studentId: "C002",
      guardianFirstName: "Luis",
      guardianLastName: "Perez",
      enrolledAt: "2023-09-01",
      status: "active",
    },
    {
      studentId: "C003",
      guardianFirstName: "Mar",
      guardianLastName: "Lopez",
      enrolledAt: "2022-09-01",
      status: "active",
    },
  ];

  const classGroups: ClassGroup[] = [
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
    {
      classGroupId: "G002",
      name: "Grupo Manana",
      courseId: "P002",
      weekdays: ["Martes"],
      startTime: "10:00",
      endTime: "11:00",
      colorClass: "bg-green-500",
      status: "active",
    },
  ];

  it("lists active and withdrawn students for the selected course", () => {
    const roster = buildCourseStudentRoster(
      "P001",
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
          classGroupId: "G001",
          enrolledAt: "2024-09-01",
          status: "inactive",
          withdrawnAt: "2025-12-15",
        },
        {
          enrollmentId: "M3",
          studentId: "C003",
          classGroupId: "G002",
          enrolledAt: "2024-09-01",
          status: "active",
        },
      ],
      classGroups,
      students,
    );

    expect(roster.active).toHaveLength(1);
    expect(roster.active[0].studentId).toBe("C001");
    expect(roster.historic).toHaveLength(1);
    expect(roster.historic[0].studentId).toBe("C002");
    expect(roster.historic[0].lastClassDate).toBe("15/12/2025");
  });
});
