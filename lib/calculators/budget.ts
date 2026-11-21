import { BUDGET_503020 } from "@/lib/config";
import { roundMoney, toNumber } from "@/lib/finance/format";

export type BudgetSplit = {
  income: number;
  needs: number;
  wants: number;
  savings: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
};

/** 50/30/20 split of a monthly income. */
export function calcBudgetSplit(income: number | string): BudgetSplit {
  const amount = Math.max(0, roundMoney(toNumber(income)));
  const needs = roundMoney(amount * (BUDGET_503020.needs / 100));
  const wants = roundMoney(amount * (BUDGET_503020.wants / 100));
  const savings = roundMoney(amount - needs - wants);

  return {
    income: amount,
    needs,
    wants,
    savings,
    needsPercent: BUDGET_503020.needs,
    wantsPercent: BUDGET_503020.wants,
    savingsPercent: BUDGET_503020.savings,
  };
}
