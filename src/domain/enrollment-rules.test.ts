import { describe, expect, it } from "vitest";
import {
  countActiveEnrollmentsInGroup,
  isGroupAtCapacity,
  isStudentActiveInGroup,
} from "./enrollment-rules";
import type { Enrollment } from "./enrollment";

const enrollments: Enrollment[] = [
  {
    enrollmentId: "M1",
    studentId: "C001",
    classGroupId: "G001",
    enrolledAt: "2025-01-01",
    status: "active",
  },
  {
    enrollmentId: "M2",
    studentId: "C002",
    classGroupId: "G001",
    enrolledAt: "2025-01-01",
    status: "inactive",
  },
  {
    enrollmentId: "M3",
    studentId: "C003",
    classGroupId: "G001",
    enrolledAt: "2025-01-01",
    status: "active",
  },
];

describe("enrollment rules", () => {
  it("counts only active enrollments in a group", () => {
    expect(countActiveEnrollmentsInGroup("G001", enrollments)).toBe(2);
  });

  it("detects active student in group", () => {
    expect(isStudentActiveInGroup("C001", "G001", enrollments)).toBe(true);
    expect(isStudentActiveInGroup("C002", "G001", enrollments)).toBe(false);
  });

  it("detects when group is at capacity", () => {
    expect(isGroupAtCapacity("G001", 2, enrollments)).toBe(true);
    expect(isGroupAtCapacity("G001", 3, enrollments)).toBe(false);
    expect(isGroupAtCapacity("G001", "", enrollments)).toBe(false);
  });
});
