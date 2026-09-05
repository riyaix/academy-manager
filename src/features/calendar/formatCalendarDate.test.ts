import { describe, expect, it } from "vitest";
import { formatFriendlyLongDate, isSameCalendarDay } from "./formatCalendarDate";

describe("formatFriendlyLongDate", () => {
  it("formats English ordinal dates", () => {
    expect(formatFriendlyLongDate(new Date(2026, 8, 13), "en-US")).toBe("13th September, 2026");
    expect(formatFriendlyLongDate(new Date(2026, 0, 1), "en")).toBe("1st January, 2026");
    expect(formatFriendlyLongDate(new Date(2026, 0, 2), "en")).toBe("2nd January, 2026");
    expect(formatFriendlyLongDate(new Date(2026, 0, 3), "en")).toBe("3rd January, 2026");
    expect(formatFriendlyLongDate(new Date(2026, 0, 11), "en")).toBe("11th January, 2026");
  });

  it("formats Spanish long dates", () => {
    expect(formatFriendlyLongDate(new Date(2026, 8, 13), "es-ES")).toBe("13 de septiembre de 2026");
  });
});

describe("isSameCalendarDay", () => {
  it("compares calendar days ignoring time", () => {
    expect(isSameCalendarDay(new Date(2026, 8, 4, 9, 0), new Date(2026, 8, 4, 23, 0))).toBe(true);
    expect(isSameCalendarDay(new Date(2026, 8, 4), new Date(2026, 8, 5))).toBe(false);
  });
});
