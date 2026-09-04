const MONTH_I18N_KEYS = [
  "months.january",
  "months.february",
  "months.march",
  "months.april",
  "months.may",
  "months.june",
  "months.july",
  "months.august",
  "months.september",
  "months.october",
  "months.november",
  "months.december",
] as const;

type TranslateFn = (key: string) => string;

/** Localized billing period label, e.g. "Marzo 2026" / "March 2026". */
export function formatBillingPeriod(t: TranslateFn, date: Date = new Date()): string {
  const monthKey = MONTH_I18N_KEYS[date.getMonth()];
  return `${t(monthKey)} ${date.getFullYear()}`;
}

export function billingPeriodFromParts(t: TranslateFn, monthIndex: number, year: number): string {
  const monthKey = MONTH_I18N_KEYS[monthIndex];
  return `${t(monthKey)} ${year}`;
}
