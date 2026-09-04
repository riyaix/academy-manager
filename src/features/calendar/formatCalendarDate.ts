/**
 * Locale-aware friendly dates for calendar headers (e.g. "13th September, 2026").
 */

function englishOrdinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/** Long display date: "13th September, 2026" (en) / "13 de septiembre de 2026" (es). */
export function formatFriendlyLongDate(date: Date, locale: string): string {
  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: "long" });
  const year = date.getFullYear();
  const isEnglish = locale.toLowerCase().startsWith("en");

  if (isEnglish) {
    const monthTitle = month.charAt(0).toUpperCase() + month.slice(1);
    return `${englishOrdinal(day)} ${monthTitle}, ${year}`;
  }

  return `${day} de ${month} de ${year}`;
}

/** Compact weekday + day for column headers. */
export function formatCalendarColumnLabel(
  date: Date,
  weekdayLabel: string,
  locale: string,
): string {
  const day = date.getDate();
  const isEnglish = locale.toLowerCase().startsWith("en");
  if (isEnglish) {
    return `${weekdayLabel} ${englishOrdinal(day)}`;
  }
  return `${weekdayLabel} ${day}`;
}

export function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
