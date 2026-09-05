/** ISO 8601 calendar date (`YYYY-MM-DD`). */
export type ISODate = string;

/** Branded string identifier for persisted entities. */
export type EntityId = string;

export type ActiveStatus = "active" | "inactive";

export type Weekday =
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

/** Spanish weekday labels used in the current UI and storage. */
export type LegacyWeekday =
  "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";
