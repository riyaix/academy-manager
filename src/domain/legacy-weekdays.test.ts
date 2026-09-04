import { describe, expect, it } from "vitest";
import {
  LEGACY_WEEKDAYS,
  legacyWeekdayFromDate,
  WEEKDAY_I18N_KEY,
  WEEKDAY_SHORT_I18N_KEY,
} from "./legacy-weekdays";

describe("legacyWeekdayFromDate", () => {
  it("maps JS Sunday to Domingo", () => {
    expect(legacyWeekdayFromDate(new Date(2026, 2, 15))).toBe("Domingo");
  });

  it("maps JS Monday to Lunes", () => {
    expect(legacyWeekdayFromDate(new Date(2026, 2, 16))).toBe("Lunes");
  });

  it("maps JS Friday to Viernes", () => {
    expect(legacyWeekdayFromDate(new Date(2026, 2, 20))).toBe("Viernes");
  });
});

describe("weekday i18n keys", () => {
  it("covers every legacy weekday label", () => {
    for (const day of LEGACY_WEEKDAYS) {
      expect(WEEKDAY_I18N_KEY[day]).toMatch(/^weekdays\./);
      expect(WEEKDAY_SHORT_I18N_KEY[day]).toMatch(/^weekdays\.short\./);
    }
  });
});
