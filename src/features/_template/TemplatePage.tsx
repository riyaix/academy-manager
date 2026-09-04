import { useTranslation } from "react-i18next";
import { Button } from "../../core/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../core/components/Card";
import { TemplateHint } from "./components/TemplateHint";
import { useTemplateGreeting } from "./hooks/useTemplateGreeting";

/**
 * Example feature page — replace with your real screen.
 * Uses core primitives, i18n keys, and a feature hook (no cross-feature imports).
 */
export function TemplatePage() {
  const { t } = useTranslation();
  const { greeting } = useTemplateGreeting(t("template.sampleName"));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("template.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--color-text)]">{greeting}</p>
          <TemplateHint />
          <Button type="button" variant="secondary">
            {t("template.action")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
