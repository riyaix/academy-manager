import { describe, expect, it } from "vitest";
import { createMockAppState } from "./mockAppState";

describe("createMockAppState", () => {
  it("provides linked demo data across all entities", () => {
    const mock = createMockAppState();

    expect(mock.students.length).toBeGreaterThanOrEqual(5);
    expect(mock.courses).toHaveLength(3);
    expect(mock.classGroups).toHaveLength(3);
    expect(mock.enrollments.length).toBeGreaterThanOrEqual(4);
    expect(mock.paymentRecords.length).toBeGreaterThanOrEqual(4);

    const courseIds = new Set(mock.courses.map((course) => course.courseId));
    for (const group of mock.classGroups) {
      expect(courseIds.has(group.courseId)).toBe(true);
    }

    const studentIds = new Set(mock.students.map((student) => student.studentId));
    const groupIds = new Set(mock.classGroups.map((group) => group.classGroupId));
    for (const enrollment of mock.enrollments) {
      expect(studentIds.has(enrollment.studentId)).toBe(true);
      expect(groupIds.has(enrollment.classGroupId)).toBe(true);
    }

    const paid = mock.paymentRecords.filter((record) => record.status === "paid");
    const pending = mock.paymentRecords.filter((record) => record.status === "pending");
    expect(paid.length).toBeGreaterThan(0);
    expect(pending.length).toBeGreaterThan(0);
  });
});
