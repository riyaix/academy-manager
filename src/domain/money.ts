export type Money = number & { readonly __brand: "MoneyCents" };

export function toMoney(value: number): Money {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid money value: ${value}`);
  }

  return Math.round(value * 100) as Money;
}

export function fromMoney(value: Money): number {
  return Number(value) / 100;
}

export function addMoney(...values: Money[]): Money {
  return values.reduce((sum, value) => (sum + value) as Money, 0 as Money);
}

export function subtractMoney(left: Money, right: Money): Money {
  return (left - right) as Money;
}

export function multiplyMoney(value: Money, quantity: number): Money {
  if (!Number.isFinite(quantity)) {
    throw new Error(`Invalid money multiplier: ${quantity}`);
  }

  return Math.round(Number(value) * quantity) as Money;
}

export function formatMoney(
  value: Money,
  locale: string,
  currency: string = "EUR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(fromMoney(value));
}
