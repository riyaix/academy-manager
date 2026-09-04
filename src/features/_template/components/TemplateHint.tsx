import { useTranslation } from "react-i18next";

/** Small, single-purpose UI piece composed by the feature page. */
export function TemplateHint() {
  const { t } = useTranslation();

  return (
    <p className="text-sm text-[var(--color-text-muted)] border-l-4 border-[var(--color-primary)] pl-3">
      {t("template.hint")}
    </p>
  );
}
