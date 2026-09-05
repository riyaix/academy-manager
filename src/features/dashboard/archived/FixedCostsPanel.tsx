import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, Wallet } from "lucide-react";
import { countMonthsInDateRange, type IncomeDateRange } from "../../../domain/income-summary";
import { fromMoney, toMoney } from "../../../domain/money";
import {
  netCollectedAfterFixedCosts,
  sumMonthlyFixedCosts,
  totalFixedCostsForRange,
} from "../../../domain/fixed-costs";
import type { FixedCosts } from "../../../domain/settings";

const INPUT_CLASS =
  "w-full border border-(--color-border) rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-mono text-base";

type FixedCostsPanelProps = {
  fixedCosts: FixedCosts;
  setFixedCosts: (value: FixedCosts) => void;
  currencySymbol: string;
  dateRange?: IncomeDateRange;
  collected: number;
};

export function FixedCostsPanel({
  fixedCosts,
  setFixedCosts,
  currencySymbol,
  dateRange,
  collected,
}: FixedCostsPanelProps) {
  const { t } = useTranslation();
  const safeDateRange = dateRange ?? {};

  const monthlyTotal = useMemo(() => sumMonthlyFixedCosts(fixedCosts), [fixedCosts]);
  const monthsInRange = useMemo(() => countMonthsInDateRange(safeDateRange), [safeDateRange]);
  const periodTotal = useMemo(
    () => totalFixedCostsForRange(fixedCosts, safeDateRange),
    [fixedCosts, safeDateRange],
  );
  const netCollected = useMemo(
    () => netCollectedAfterFixedCosts(toMoney(collected), fixedCosts, safeDateRange),
    [collected, fixedCosts, safeDateRange],
  );

  const updateCost = (field: keyof FixedCosts, rawValue: string) => {
    const parsed = Number.parseFloat(rawValue);
    const nextValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    setFixedCosts({
      ...fixedCosts,
      [field]: toMoney(nextValue),
    });
  };

  const fields = [
    {
      key: "selfEmployedFee" as const,
      label: t("dashboard.fixedCosts.selfEmployed"),
      value: fromMoney(fixedCosts.selfEmployedFee),
    },
    {
      key: "rent" as const,
      label: t("dashboard.fixedCosts.rent"),
      value: fromMoney(fixedCosts.rent),
    },
    {
      key: "other" as const,
      label: t("dashboard.fixedCosts.other"),
      value: fromMoney(fixedCosts.other),
    },
  ];

  return (
    <div className="bg-(--color-surface-elevated) border border-(--color-border) rounded-xl shadow-sm p-6">
      <div className="mb-6 border-b border-(--color-border) pb-4">
        <h3 className="font-bold text-(--color-text) flex items-center text-lg">
          <Calculator className="w-5 h-5 mr-2 text-indigo-600" />
          {t("dashboard.fixedCosts.title")}
        </h3>
        <p className="text-sm text-(--color-text-muted) mt-1">{t("dashboard.fixedCosts.hint")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="font-bold text-(--color-text) text-sm mb-1 block">
              {field.label}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={field.value}
                onChange={(e) => updateCost(field.key, e.target.value)}
                className={`${INPUT_CLASS} pr-10`}
              />
              <span className="absolute right-3 top-2.5 text-(--color-text-muted) text-sm font-bold">
                {currencySymbol}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-4">
          <p className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider mb-1">
            {t("dashboard.fixedCosts.monthlyTotal")}
          </p>
          <p className="text-2xl font-black text-(--color-text)">
            {fromMoney(monthlyTotal).toFixed(2)} {currencySymbol}
          </p>
        </div>

        <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-4">
          <p className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider mb-1">
            {t("dashboard.fixedCosts.periodTotal", { count: monthsInRange })}
          </p>
          <p className="text-2xl font-black text-orange-600">
            {fromMoney(periodTotal).toFixed(2)} {currencySymbol}
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
              {t("dashboard.fixedCosts.netCollected")}
            </p>
            <p
              className={`text-2xl font-black ${netCollected >= 0 ? "text-indigo-700" : "text-(--color-danger)"}`}
            >
              {fromMoney(netCollected).toFixed(2)} {currencySymbol}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
