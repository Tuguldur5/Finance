import { roundMoney, toNumber } from "./format";

export type BudgetProgress = {
  amount: number;
  spent: number;
  remaining: number;
  /** 0–100+, one decimal. */
  percentUsed: number;
  isOverBudget: boolean;
  overspend: number;
};

/**
 * Budget usage for one category.
 * spending is compared against a positive limit; overspend is the amount
 * beyond the limit (never negative).
 */
export function getBudgetProgress(
  amount: number | string,
  spent: number | string,
): BudgetProgress {
  const limit = roundMoney(toNumber(amount));
  const used = roundMoney(toNumber(spent));
  const remaining = roundMoney(limit - used);
  const percentUsed = limit > 0 ? Math.round((used / limit) * 1000) / 10 : 0;

  return {
    amount: limit,
    spent: used,
    remaining,
    percentUsed,
    isOverBudget: used > limit,
    overspend: remaining < 0 ? Math.abs(remaining) : 0,
  };
}

export type BudgetTotals = {
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
};

/** Aggregate multiple budgets for the month summary. */
export function getBudgetTotals(
  budgets: { amount: number | string; spent: number | string }[],
): BudgetTotals {
  const amount = roundMoney(
    budgets.reduce((sum, budget) => sum + toNumber(budget.amount), 0),
  );
  const spent = roundMoney(
    budgets.reduce((sum, budget) => sum + toNumber(budget.spent), 0),
  );

  return {
    amount,
    spent,
    remaining: roundMoney(amount - spent),
    percentUsed: amount > 0 ? Math.round((spent / amount) * 1000) / 10 : 0,
    isOverBudget: spent > amount,
  };
}
