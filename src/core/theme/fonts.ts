/** CSS variable name for the global UI font — change default in index.css. */
export const FONT_FAMILY_VAR = "--font-family-sans";

/** Bundled Atkinson Hyperlegible — used for all UI text. */
export const APP_FONT_FAMILY =
  '"Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif';

export type FontSizePreference = "small" | "normal" | "large" | "x-large";

const FONT_SIZE_LEGACY: Record<string, FontSizePreference> = {
  pequeña: "small",
  small: "small",
  normal: "normal",
  grande: "large",
  large: "large",
  "x-large": "x-large",
};

export function normalizeFontSize(value: string | null | undefined): FontSizePreference {
  if (!value) return "normal";
  return FONT_SIZE_LEGACY[value] ?? "normal";
}

export function applyAppFont(): void {
  document.documentElement.style.setProperty(FONT_FAMILY_VAR, APP_FONT_FAMILY);
}

const FONT_SIZE_CLASSES: Record<FontSizePreference, string> = {
  small: "text-sm leading-normal",
  normal: "text-base leading-normal",
  large: "text-lg leading-relaxed",
  "x-large": "text-xl leading-relaxed",
};

export function applyFontSize(size: FontSizePreference): void {
  const root = document.documentElement;
  // Remove all previous font-size / line-height classes
  for (const cls of Object.values(FONT_SIZE_CLASSES)) {
    for (const c of cls.split(" ")) {
      root.classList.remove(c);
    }
  }
  for (const c of (FONT_SIZE_CLASSES[size] ?? FONT_SIZE_CLASSES.normal).split(" ")) {
    root.classList.add(c);
  }
}
