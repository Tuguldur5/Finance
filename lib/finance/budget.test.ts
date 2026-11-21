import { describe, expect, it } from "vitest";

import { getBudgetProgress, getBudgetTotals } from "./budget";

describe("getBudgetProgress", () => {
  it("computes remaining money and usage", () => {
    const progress = getBudgetProgress(500_000, 125_000);

    expect(progress.remaining).toBe(375_000);
    expect(progress.percentUsed).toBe(25);
    expect(progress.isOverBudget).toBe(false);
    expect(progress.overspend).toBe(0);
  });

  it("flags overspending", () => {
    const progress = getBudgetProgress(500_000, 600_000);

    expect(progress.remaining).toBe(-100_000);
    expect(progress.percentUsed).toBe(120);
    expect(progress.isOverBudget).toBe(true);
    expect(progress.overspend).toBe(100_000);
  });

  it("handles a zero limit without dividing by zero", () => {
    const progress = getBudgetProgress(0, 100);

    expect(progress.percentUsed).toBe(0);
    expect(progress.isOverBudget).toBe(true);
    expect(progress.overspend).toBe(100);
  });

  it("accepts numeric strings from Postgres", () => {
    const progress = getBudgetProgress("250000.00", "100000.50");

    expect(progress.amount).toBe(250_000);
    expect(progress.spent).toBe(100_000.5);
    expect(progress.remaining).toBe(149_999.5);
  });
});

describe("getBudgetTotals", () => {
  it("sums budgets and spending", () => {
    const totals = getBudgetTotals([
      { amount: 300_000, spent: 150_000 },
      { amount: 200_000, spent: 260_000 },
    ]);

    expect(totals.amount).toBe(500_000);
    expect(totals.spent).toBe(410_000);
    expect(totals.remaining).toBe(90_000);
    expect(totals.percentUsed).toBe(82);
    expect(totals.isOverBudget).toBe(false);
  });
});
