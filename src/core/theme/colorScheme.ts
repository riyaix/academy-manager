export type ColorSchemePreference = "system" | "light" | "dark";

export const COLOR_SCHEME_STORAGE_KEY = "academy_manager_color_scheme";

const VALID: ReadonlySet<string> = new Set(["system", "light", "dark"]);

export function normalizeColorScheme(value: string | null | undefined): ColorSchemePreference {
  if (value && VALID.has(value)) return value as ColorSchemePreference;
  return "system";
}

export function resolveEffectiveScheme(preference: ColorSchemePreference): "light" | "dark" {
  if (preference === "light" || preference === "dark") return preference;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies or removes the `.dark` class on `<html>`. */
export function applyColorScheme(preference: ColorSchemePreference): "light" | "dark" {
  const effective = resolveEffectiveScheme(preference);
  document.documentElement.classList.toggle("dark", effective === "dark");
  document.documentElement.style.colorScheme = effective;
  return effective;
}

export function readStoredColorScheme(): ColorSchemePreference {
  try {
    return normalizeColorScheme(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function persistColorScheme(preference: ColorSchemePreference): void {
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, preference);
  } catch {
    // ignore
  }
}
