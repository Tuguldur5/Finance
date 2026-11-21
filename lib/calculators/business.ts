import { roundMoney, toNumber } from "@/lib/finance/format";

/** Small-business calculators: profit, margin, break-even, discount. */

export type ProfitResult = {
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  isLoss: boolean;
};

export function calcProfit(input: {
  revenue: number | string;
  cost: number | string;
}): ProfitResult {
  const revenue = Math.max(0, toNumber(input.revenue));
  const cost = Math.max(0, toNumber(input.cost));
  const profit = roundMoney(revenue - cost);

  return {
    revenue: roundMoney(revenue),
    cost: roundMoney(cost),
    profit,
    marginPercent:
      revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
    isLoss: profit < 0,
  };
}

export type MarginResult = {
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  markupPercent: number;
  costPercent: number;
};

export function calcMargin(input: {
  revenue: number | string;
  cost: number | string;
}): MarginResult {
  const revenue = Math.max(0, toNumber(input.revenue));
  const cost = Math.max(0, toNumber(input.cost));
  const profit = roundMoney(revenue - cost);

  return {
    revenue: roundMoney(revenue),
    cost: roundMoney(cost),
    profit,
    marginPercent:
      revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
    markupPercent:
      cost > 0 ? Math.round((profit / cost) * 1000) / 10 : 0,
    costPercent:
      revenue > 0 ? Math.round((cost / revenue) * 1000) / 10 : 0,
  };
}

export type BreakEvenResult = {
  fixedCosts: number;
  pricePerUnit: number;
  variableCostPerUnit: number;
  contributionPerUnit: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  isFeasible: boolean;
};

export function calcBreakEven(input: {
  fixedCosts: number | string;
  pricePerUnit: number | string;
  variableCostPerUnit: number | string;
}): BreakEvenResult {
  const fixedCosts = Math.max(0, toNumber(input.fixedCosts));
  const pricePerUnit = Math.max(0, toNumber(input.pricePerUnit));
  const variableCostPerUnit = Math.max(0, toNumber(input.variableCostPerUnit));
  const contributionPerUnit = roundMoney(pricePerUnit - variableCostPerUnit);
  const isFeasible = contributionPerUnit > 0;
  const breakEvenUnits = isFeasible
    ? Math.ceil(fixedCosts / contributionPerUnit)
    : 0;

  return {
    fixedCosts: roundMoney(fixedCosts),
    pricePerUnit: roundMoney(pricePerUnit),
    variableCostPerUnit: roundMoney(variableCostPerUnit),
    contributionPerUnit,
    breakEvenUnits,
    breakEvenRevenue: roundMoney(breakEvenUnits * pricePerUnit),
    isFeasible,
  };
}

export type DiscountResult = {
  price: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
};

export function calcDiscount(input: {
  price: number | string;
  discountPercent: number | string;
}): DiscountResult {
  const price = Math.max(0, toNumber(input.price));
  const discountPercent = Math.min(
    100,
    Math.max(0, toNumber(input.discountPercent)),
  );
  const discountAmount = roundMoney(price * (discountPercent / 100));

  return {
    price: roundMoney(price),
    discountPercent,
    discountAmount,
    finalPrice: roundMoney(price - discountAmount),
  };
}
