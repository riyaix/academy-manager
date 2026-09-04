import type { IncomeDateRange } from "./income-summary";
import { countMonthsInDateRange } from "./income-summary";
import type { Money } from "./money";
import { addMoney, multiplyMoney, subtractMoney } from "./money";
import type { FixedCosts } from "./settings";

export function sumMonthlyFixedCosts(costs: FixedCosts): Money {
  return addMoney(costs.selfEmployedFee, costs.rent, costs.other);
}

export function totalFixedCostsForRange(costs: FixedCosts, range: IncomeDateRange): Money {
  const months = countMonthsInDateRange(range);
  return multiplyMoney(sumMonthlyFixedCosts(costs), months);
}

export function netCollectedAfterFixedCosts(
  collected: Money,
  costs: FixedCosts,
  range: IncomeDateRange,
): Money {
  return subtractMoney(collected, totalFixedCostsForRange(costs, range));
}
