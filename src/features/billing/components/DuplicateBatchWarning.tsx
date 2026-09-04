import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DuplicateBillingConflict } from "../../../domain/billing";

type DuplicateBatchWarningProps = {
  conflicts: DuplicateBillingConflict[];
};

export function DuplicateBatchWarning({ conflicts }: DuplicateBatchWarningProps) {
  const { t } = useTranslation();

  if (conflicts.length === 0) return null;

  return (
    <div
      role="alert"
      className="bg-[var(--color-danger-surface)] border border-[var(--color-border)] p-3 rounded-lg flex items-start gap-2 mb-4"
    >
      <AlertCircle className="w-5 h-5 text-[var(--color-danger)] shrink-0 mt-0.5" aria-hidden />
      <div className="text-xs text-[var(--color-danger)] font-medium">
        <p className="font-bold mb-1">
          {t("billing.duplicateWarningTitle")} ({conflicts.length})
        </p>
        <ul className="space-y-1">
          {conflicts.map((conflict) => (
            <li key={conflict.recordId}>
              {conflict.recordId} — {conflict.payerName}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
