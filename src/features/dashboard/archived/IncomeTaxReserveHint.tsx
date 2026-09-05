import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PiggyBank } from "lucide-react";
import { suggestedIncomeTaxReserve } from "../../../domain/income-tax-reserve";
import { fromMoney, toMoney } from "../../../domain/money";
import { normalizeTaxMode } from "../../../domain/settings";

type IncomeTaxReserveHintProps = {
  collected: number;
  taxMode?: string | null;
  defaultVatRate?: number | null;
  defaultIncomeTaxReserveRate?: number | null;
  currencySymbol: string;
};

export function IncomeTaxReserveHint({
  collected,
  taxMode,
  defaultVatRate,
  defaultIncomeTaxReserveRate,
  currencySymbol,
}: IncomeTaxReserveHintProps) {
  const { t } = useTranslation();

  const reserveAmount = useMemo(
    () =>
      suggestedIncomeTaxReserve(
        toMoney(collected),
        normalizeTaxMode(taxMode),
        defaultIncomeTaxReserveRate ?? 20,
        defaultVatRate ?? 0,
      ),
    [collected, taxMode, defaultIncomeTaxReserveRate, defaultVatRate],
  );

  const effectiveRate =
    normalizeTaxMode(taxMode) === "custom" ? (defaultIncomeTaxReserveRate ?? 20) : 20;

  if (collected <= 0) return null;

  return (
    <div className="mb-8 bg-(--color-warning-surface) border border-(--color-border) rounded-xl p-4 flex items-start gap-3">
      <div className="p-2 bg-(--color-warning-surface) text-(--color-warning) rounded-lg shrink-0">
        <PiggyBank className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-(--color-text)">
          {t("dashboard.incomeTaxReserve.title", {
            rate: effectiveRate,
            amount: fromMoney(reserveAmount).toFixed(2),
            currency: currencySymbol,
          })}
        </p>
        <p className="text-xs text-(--color-warning) mt-1">
          {t("dashboard.incomeTaxReserve.hint")}
        </p>
      </div>
    </div>
  );
}
