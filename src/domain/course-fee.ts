/** Parse and normalize monthly course fee input. */
export function parseCourseFee(value: string | number): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
