import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../app/store/appStore";
import {
  normalizeColorScheme,
  resolveEffectiveScheme,
} from "../theme/colorScheme";

/** Sidebar control: toggles between light and dark (sets an explicit preference). */
export function ThemeToggle() {
  const { t } = useTranslation();
  const colorScheme = useAppStore((state) => state.colorScheme);
  const setColorScheme = useAppStore((state) => state.setColorScheme);

  const effective = resolveEffectiveScheme(normalizeColorScheme(colorScheme));
  const isDark = effective === "dark";

  return (
    <button
      type="button"
      className="inline-flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 min-h-[44px] text-sm font-semibold text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sidebar-accent)] cursor-pointer"
      aria-label={isDark ? t("a11y.switchToLight") : t("a11y.switchToDark")}
      onClick={() => setColorScheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {isDark ? t("settings.theme.light") : t("settings.theme.dark")}
    </button>
  );
}
