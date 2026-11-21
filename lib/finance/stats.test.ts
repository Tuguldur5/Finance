import { describe, expect, it } from "vitest";

import {
  getCashFlow,
  getCategoryBreakdown,
  getDailySeries,
  getMonthlySeries,
  getNetWorth,
} from "./stats";

const tx = (
  type: string,
  amount: number | string,
  extra: Partial<{ category_id: string | null; occurred_at: string }> = {},
) => ({ type, amount, ...extra });

describe("getCashFlow", () => {
  it("sums income and expense and derives the savings rate", () => {
    expect(
      getCashFlow([
        tx("income", 1_000_000),
        tx("income", "500000"),
        tx("expense", 600_000),
      ]),
    ).toEqual({
      income: 1_500_000,
      expense: 600_000,
      net: 900_000,
      savingsRate: 60,
    });
  });

  it("ignores transfers and handles zero income", () => {
    expect(
      getCashFlow([tx("transfer", 250_000), tx("expense", 100_000)]),
    ).toEqual({ income: 0, expense: 100_000, net: -100_000, savingsRate: 0 });
  });

  it("rounds to two decimals", () => {
    const result = getCashFlow([tx("income", 1234.567), tx("expense", 0.1)]);
    expect(result.income).toBe(1234.57);
    expect(result.expense).toBe(0.1);
    expect(result.net).toBe(1234.47);
  });
});

describe("getCategoryBreakdown", () => {
  const transactions = [
    tx("expense", 300, { category_id: "food" }),
    tx("expense", 100, { category_id: "food" }),
    tx("expense", 500, { category_id: "rent" }),
    tx("expense", 50, { category_id: null }),
    tx("income", 900, { category_id: "salary" }),
  ];

  it("groups expenses by category, largest first", () => {
    expect(getCategoryBreakdown(transactions)).toEqual([
      { categoryId: "rent", amount: 500 },
      { categoryId: "food", amount: 400 },
      { categoryId: null, amount: 50 },
    ]);
  });

  it("can group income instead", () => {
    expect(getCategoryBreakdown(transactions, "income")).toEqual([
      { categoryId: "salary", amount: 900 },
    ]);
  });
});

describe("getMonthlySeries", () => {
  it("buckets transactions by month and fills empty buckets", () => {
    const series = getMonthlySeries(
      [
        tx("income", 1000, { occurred_at: "2026-01-05" }),
        tx("expense", 200, { occurred_at: "2026-01-20" }),
        tx("expense", 300, { occurred_at: "2026-03-01" }),
        tx("income", 999, { occurred_at: "2025-12-31" }),
      ],
      ["2026-01", "2026-02", "2026-03"],
    );

    expect(series).toEqual([
      { bucket: "2026-01", income: 1000, expense: 200, net: 800 },
      { bucket: "2026-02", income: 0, expense: 0, net: 0 },
      { bucket: "2026-03", income: 0, expense: 300, net: -300 },
    ]);
  });
});

describe("getDailySeries", () => {
  it("buckets transactions by day", () => {
    const series = getDailySeries(
      [
        tx("income", 100, { occurred_at: "2026-05-01T10:00:00Z" }),
        tx("expense", 40, { occurred_at: "2026-05-02T10:00:00Z" }),
      ],
      ["2026-05-01", "2026-05-02"],
    );

    expect(series.map((row) => row.net)).toEqual([100, -40]);
  });
});

describe("getNetWorth", () => {
  it("subtracts liabilities from assets", () => {
    expect(getNetWorth(5_000_000, 1_250_000)).toEqual({
      assets: 5_000_000,
      liabilities: 1_250_000,
      netWorth: 3_750_000,
    });
  });

  it("accepts string amounts and rounds", () => {
    const result = getNetWorth(Number("100.005"), 0.005);
    expect(result.netWorth).toBe(100);
  });
});
