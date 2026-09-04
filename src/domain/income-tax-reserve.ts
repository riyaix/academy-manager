import { calculateTaxBreakdown } from "./billing";
import type { Money } from "./money";
import type { TaxMode } from "./settings";

/** Suggested personal income-tax set-aside — display only, not tax filing. */
export function suggestedIncomeTaxReserve(
  collectedAmount: Money,
  taxMode: TaxMode | string,
  incomeTaxReserveRate: number,
  defaultVatRate = 0,
): Money {
  if (collectedAmount <= 0) return collectedAmount;

  const breakdown = calculateTaxBreakdown(
    collectedAmount,
    taxMode,
    defaultVatRate,
    incomeTaxReserveRate,
  );

  return breakdown.incomeTaxReserveAmount;
}
