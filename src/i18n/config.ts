import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "../locales/es/translation.json";
import en from "../locales/en/translation.json";

const LOCALE_STORAGE_KEY = "app_locale";

function getStoredLocale(): string {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // localStorage unavailable (SSR/tests)
  }
  return "es";
}

function applyDocumentLang(lng: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lng.startsWith("en") ? "en" : "es";
}

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: getStoredLocale(),
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
});

applyDocumentLang(i18n.language);

i18n.on("languageChanged", (lng) => {
  applyDocumentLang(lng);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  } catch {
    // ignore
  }
});

export { LOCALE_STORAGE_KEY };
export default i18n;
