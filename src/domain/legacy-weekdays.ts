import type { LegacyWeekday } from "./shared";

export const LEGACY_WEEKDAYS: readonly LegacyWeekday[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export const WEEKDAY_I18N_KEY: Record<LegacyWeekday, string> = {
  Lunes: "weekdays.monday",
  Martes: "weekdays.tuesday",
  Miércoles: "weekdays.wednesday",
  Jueves: "weekdays.thursday",
  Viernes: "weekdays.friday",
  Sábado: "weekdays.saturday",
  Domingo: "weekdays.sunday",
};

export const WEEKDAY_SHORT_I18N_KEY: Record<LegacyWeekday, string> = {
  Lunes: "weekdays.short.monday",
  Martes: "weekdays.short.tuesday",
  Miércoles: "weekdays.short.wednesday",
  Jueves: "weekdays.short.thursday",
  Viernes: "weekdays.short.friday",
  Sábado: "weekdays.short.saturday",
  Domingo: "weekdays.short.sunday",
};

const JS_DAY_TO_LEGACY: LegacyWeekday[] = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** Map a JS Date to the legacy weekday label stored on class groups. */
export function legacyWeekdayFromDate(date: Date): LegacyWeekday {
  return JS_DAY_TO_LEGACY[date.getDay()];
}
