import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatGreeting } from "../formatGreeting";

/** Example hook — extract stateful or derived UI logic from page components. */
export function useTemplateGreeting(name: string) {
  const { t } = useTranslation();

  const greeting = useMemo(() => formatGreeting(name), [name]);

  return {
    greeting,
    hint: t("template.hint"),
  };
}
