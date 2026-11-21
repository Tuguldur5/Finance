import { roundMoney, toNumber } from "./format";

/**
 * Aggregations used by the dashboard and reports. Every input accepts the
 * raw Postgres-friendly transaction shape so these stay testable without a
 * database.
 */

export type StatTransaction = {
  type: string;
  amount: number | string;
  category_id?: string | null;
  occurred_at?: string;
};

export type CashFlow = {
  income: number;
  expense: number;
  net: number;
  /** Net as a percentage of income. 0 when there is no income. */
  savingsRate: number;
};

export function getCashFlow(transactions: StatTransaction[]): CashFlow {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    const amount = toNumber(transaction.amount);
    if (transaction.type === "income") income += amount;
    else if (transaction.type === "expense") expense += amount;
  }

  income = roundMoney(income);
  expense = roundMoney(expense);
  const net = roundMoney(income - expense);
  const savingsRate =
    income > 0 ? Math.round((net / income) * 1000) / 10 : 0;

  return { income, expense, net, savingsRate };
}

export type CategoryAmount = {
  categoryId: string | null;
  amount: number;
};

export function getCategoryBreakdown(
  transactions: StatTransaction[],
  type: "income" | "expense" = "expense",
): CategoryAmount[] {
  const totals = new Map<string | null, number>();

  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    const categoryId = transaction.category_id ?? null;
    totals.set(
      categoryId,
      (totals.get(categoryId) ?? 0) + toNumber(transaction.amount),
    );
  }

  return [...totals.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount: roundMoney(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export type TrendPoint = {
  bucket: string;
  income: number;
  expense: number;
  net: number;
};

function buildSeries(
  transactions: StatTransaction[],
  buckets: string[],
  bucketOf: (transaction: StatTransaction) => string | null,
): TrendPoint[] {
  const index = new Map(buckets.map((bucket, position) => [bucket, position]));
  const rows = buckets.map((bucket) => ({
    bucket,
    income: 0,
    expense: 0,
    net: 0,
  }));

  for (const transaction of transactions) {
    const bucket = bucketOf(transaction);
    if (!bucket) continue;
    const position = index.get(bucket);
    if (position === undefined) continue;

    const amount = toNumber(transaction.amount);
    if (transaction.type === "income") rows[position].income += amount;
    else if (transaction.type === "expense") rows[position].expense += amount;
  }

  return rows.map((row) => ({
    bucket: row.bucket,
    income: roundMoney(row.income),
    expense: roundMoney(row.expense),
    net: roundMoney(row.income - row.expense),
  }));
}

/** Buckets transactions into the supplied `yyyy-MM` keys. */
export function getMonthlySeries(
  transactions: StatTransaction[],
  months: string[],
): TrendPoint[] {
  return buildSeries(transactions, months, (transaction) => {
    if (!transaction.occurred_at) return null;
    return transaction.occurred_at.slice(0, 7);
  });
}

/** Buckets transactions into the supplied `yyyy-MM-dd` keys. */
export function getDailySeries(
  transactions: StatTransaction[],
  days: string[],
): TrendPoint[] {
  return buildSeries(transactions, days, (transaction) => {
    if (!transaction.occurred_at) return null;
    return transaction.occurred_at.slice(0, 10);
  });
}

export type NetWorth = {
  assets: number;
  liabilities: number;
  netWorth: number;
};

export function getNetWorth(assets: number, liabilities: number): NetWorth {
  const roundedAssets = roundMoney(toNumber(assets));
  const roundedLiabilities = roundMoney(toNumber(liabilities));

  return {
    assets: roundedAssets,
    liabilities: roundedLiabilities,
    netWorth: roundMoney(roundedAssets - roundedLiabilities),
  };
}
