import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLocale = i18n.language.startsWith("en") ? "en" : "es";

  return (
    <div className="px-4 pb-4">
      <label
        htmlFor="app-language"
        className="flex items-center gap-2 text-xs font-medium text-[var(--color-sidebar-muted)] uppercase tracking-wider mb-2"
      >
        <Languages className="w-3.5 h-3.5" aria-hidden />
        {t("language.label")}
      </label>
      <select
        id="app-language"
        value={currentLocale}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        className="w-full min-h-[44px] bg-[var(--color-sidebar-elevated)] text-[var(--color-sidebar-text)] text-sm rounded-lg px-3 py-2 border border-[var(--color-sidebar-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
      >
        <option value="es">{t("language.es")}</option>
        <option value="en">{t("language.en")}</option>
      </select>
    </div>
  );
}
