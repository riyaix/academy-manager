/** Format Spanish DNI/NIE/CIF style identifiers for display inputs. */
export function formatTaxIdentifier(value: string): string {
  if (!value) return "";

  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 0) return "";

  if (/[A-Z]/.test(clean[0])) {
    const letter = clean.slice(0, 1);
    const rest = clean.slice(1, 9);
    const formattedRest = rest.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${letter}-${formattedRest}`;
  }

  const numbers = clean.slice(0, 8);
  const letter = clean.slice(8, 9);
  const formattedNumbers = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return letter ? `${formattedNumbers}-${letter}` : formattedNumbers;
}

export function formatDniNumbers(value: string, separator = "."): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const pattern = new RegExp(`\\B(?=(\\d{3})+(?!\\d))`, "g");
  return digits.replace(pattern, separator);
}
