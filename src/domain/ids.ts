/**
 * Stable sequential ID helpers — use max(existing) + 1, not array length.
 */

export function parsePrefixedNumericId(id: string, prefix: string): number | null {
  if (!id.startsWith(prefix)) return null;
  const numeric = parseInt(id.slice(prefix.length), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

/** Next ID like C001, P001, G001 from all existing IDs. */
export function nextPrefixedId(prefix: string, pad: number, existingIds: string[]): string {
  let max = 0;
  for (const id of existingIds) {
    const value = parsePrefixedNumericId(id, prefix);
    if (value !== null) max = Math.max(max, value);
  }
  return `${prefix}${(max + 1).toString().padStart(pad, "0")}`;
}

/** Payment record IDs: F-2026-001 */
export function parsePaymentRecordSequence(id: string, year: number): number | null {
  return parsePrefixedNumericId(id, `F-${year}-`);
}

export function formatPaymentRecordId(year: number, sequence: number): string {
  return `F-${year}-${sequence.toString().padStart(3, "0")}`;
}
