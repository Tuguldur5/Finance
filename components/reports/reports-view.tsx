"use client";

import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { BarChart3, ChevronLeft, ChevronRight, Download } from "lucide-react";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";
import {
  useNetWorthSnapshots,
  useReportTransactions,
} from "@/hooks/use-reports";
import { useWallets } from "@/hooks/use-wallets";
import { formatMonthMn, todayISO } from "@/lib/date";
import { downloadCsv, type CsvRows } from "@/lib/csv";
import { formatMoney, formatNumber, toNumber } from "@/lib/finance/format";
import {
  getCashFlow,
  getCategoryBreakdown,
  getDailySeries,
  getMonthlySeries,
  getNetWorth,
} from "@/lib/finance/stats";
import { t } from "@/lib/i18n";

type Period = "month" | "year";

const trendConfig = {
  income: { label: t("reports.income"), color: "var(--chart-2)" },
  expense: { label: t("reports.expense"), color: "var(--chart-5)" },
} satisfies ChartConfig;

const netWorthConfig = {
  netWorth: { label: t("dashboard.netWorth"), color: "var(--chart-1)" },
} satisfies ChartConfig;

function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 1)}тэрбум`;
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}сая`;
  if (abs >= 10_000) return `${formatNumber(value / 1_000, 0)}мян`;
  return formatNumber(value);
}

export function ReportsView() {
  const today = todayISO();
  const [period, setPeriod] = React.useState<Period>("month");
  const [anchor, setAnchor] = React.useState(() => parseISO(today));

  const from =
    period === "month"
      ? format(startOfMonth(anchor), "yyyy-MM-dd")
      : format(startOfYear(anchor), "yyyy-MM-dd");
  const to =
    period === "month"
      ? format(endOfMonth(anchor), "yyyy-MM-dd")
      : format(endOfYear(anchor), "yyyy-MM-dd");

  const transactionsQuery = useReportTransactions(from, to);
  const snapshotsQuery = useNetWorthSnapshots();
  const categoriesQuery = useCategories();
  const walletsQuery = useWallets();

  const transactions = React.useMemo(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data],
  );
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const wallets = React.useMemo(
    () => walletsQuery.data ?? [],
    [walletsQuery.data],
  );
  const snapshots = React.useMemo(
    () => snapshotsQuery.data ?? [],
    [snapshotsQuery.data],
  );

  const categoriesById = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const walletsById = React.useMemo(
    () => new Map(wallets.map((wallet) => [wallet.wallet_id, wallet])),
    [wallets],
  );

  const cashFlow = getCashFlow(transactions);

  const buckets = React.useMemo(() => {
    if (period === "month") {
      return eachDayOfInterval({
        start: startOfMonth(anchor),
        end: endOfMonth(anchor),
      }).map((day) => format(day, "yyyy-MM-dd"));
    }
    return Array.from(
      { length: 12 },
      (_, index) => `${anchor.getFullYear()}-${String(index + 1).padStart(2, "0")}`,
    );
  }, [period, anchor]);

  const trend = React.useMemo(
    () =>
      period === "month"
        ? getDailySeries(transactions, buckets)
        : getMonthlySeries(transactions, buckets),
    [period, transactions, buckets],
  );

  const breakdown = React.useMemo(() => {
    const rows = getCategoryBreakdown(transactions, "expense");
    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    return rows.slice(0, 10).map((row) => {
      const category = row.categoryId
        ? categoriesById.get(row.categoryId)
        : undefined;
      return {
        id: row.categoryId ?? "uncategorized",
        name: category?.name ?? t("common.unknown"),
        color: category?.color ?? "#64748b",
        amount: row.amount,
        percent: total > 0 ? Math.round((row.amount / total) * 1000) / 10 : 0,
      };
    });
  }, [transactions, categoriesById]);

  const netWorthSeries = React.useMemo(
    () =>
      snapshots
        .filter((snapshot) => snapshot.date >= from && snapshot.date <= to)
        .map((snapshot) => {
          const totals = getNetWorth(
            toNumber(snapshot.assets),
            toNumber(snapshot.liabilities),
          );
          return {
            date: snapshot.date,
            netWorth: totals.netWorth,
          };
        }),
    [snapshots, from, to],
  );

  function shift(direction: -1 | 1) {
    setAnchor((current) =>
      period === "month"
        ? addMonths(current, direction)
        : addYears(current, direction),
    );
  }

  function exportCsv() {
    const rows: CsvRows = [
      [
        t("common.date"),
        t("common.type"),
        t("common.category"),
        t("common.wallet"),
        t("common.amount"),
        t("common.currency"),
        t("common.note"),
      ],
    ];

    for (const transaction of [...transactions].sort((a, b) =>
      a.occurred_at.localeCompare(b.occurred_at),
    )) {
      rows.push([
        transaction.occurred_at,
        transaction.type === "income"
          ? t("transactionTypes.income")
          : transaction.type === "expense"
            ? t("transactionTypes.expense")
            : t("transactionTypes.transfer"),
        transaction.category_id
          ? (categoriesById.get(transaction.category_id)?.name ?? "")
          : "",
        walletsById.get(transaction.wallet_id)?.name ?? "",
        toNumber(transaction.amount),
        transaction.currency,
        transaction.note ?? "",
      ]);
    }

    downloadCsv(`sankhuu-${from}-${to}.csv`, rows);
    toast.success(t("toasts.exported"));
  }

  const periodLabel =
    period === "month"
      ? formatMonthMn(anchor)
      : `${anchor.getFullYear()} ${t("common.year")}`;

  const isLoading =
    transactionsQuery.isLoading ||
    snapshotsQuery.isLoading ||
    categoriesQuery.isLoading;

  return (
    <>
      <PageHeader
        title={t("reports.title")}
        description={t("reports.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={transactions.length === 0}
          >
            <Download className="size-4" />
            {t("reports.exportCsv")}
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs value={period} onValueChange={(next) => setPeriod(next as Period)}>
          <TabsList>
            <TabsTrigger value="month">{t("reports.monthly")}</TabsTrigger>
            <TabsTrigger value="year">{t("reports.yearly")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => shift(-1)}
            aria-label={t("common.back")}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 px-1 text-center text-sm font-medium">
            {periodLabel}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => shift(1)}
            aria-label={t("common.next")}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-1"
            onClick={() => setAnchor(parseISO(today))}
          >
            {t("common.today")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      ) : transactionsQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
          <p className="text-sm text-destructive">
            {transactionsQuery.error instanceof Error
              ? transactionsQuery.error.message
              : t("errors.loadFailed")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void transactionsQuery.refetch()}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={t("reports.emptyTitle")}
          description={t("reports.emptyDescription")}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">
                  {t("reports.income")}
                </p>
                <Money
                  amount={cashFlow.income}
                  className="mt-1 block text-lg font-semibold"
                />
              </CardContent>
            </Card>
            <Card className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">
                  {t("reports.expense")}
                </p>
                <Money
                  amount={cashFlow.expense}
                  className="mt-1 block text-lg font-semibold"
                />
              </CardContent>
            </Card>
            <Card className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">
                  {t("reports.net")}
                </p>
                <Money
                  amount={cashFlow.net}
                  tone="auto"
                  className="mt-1 block text-lg font-semibold"
                />
              </CardContent>
            </Card>
            <Card className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">
                  {t("reports.savingsRate")}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {cashFlow.savingsRate}%
                </p>
                <Progress
                  value={Math.max(0, Math.min(cashFlow.savingsRate, 100))}
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            <Card className="gap-0 py-4 lg:col-span-3">
              <CardHeader className="px-4 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("reports.incomeVsExpense")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ChartContainer config={trendConfig} className="h-64 w-full">
                  <BarChart
                    data={trend}
                    margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                    barGap={2}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="bucket"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: string) =>
                        period === "month"
                          ? String(Number(value.slice(8)))
                          : String(Number(value.slice(5)))
                      }
                    />
                    <YAxis
                      width={52}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => compactMoney(value)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatMoney(Number(value))}
                        />
                      }
                    />
                    <Bar
                      dataKey="income"
                      fill="var(--color-income)"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      fill="var(--color-expense)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4 lg:col-span-2">
              <CardHeader className="px-4 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("reports.byCategory")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                {breakdown.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {t("reports.breakdownEmpty")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {breakdown.map((row) => (
                      <li key={row.id}>
                        <div className="mb-1 flex items-center gap-2 text-xs">
                          <span
                            className="size-2 shrink-0 rounded-sm"
                            style={{ backgroundColor: row.color }}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {row.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {row.percent}%
                          </span>
                          <Money amount={row.amount} className="tabular-nums" />
                        </div>
                        <Progress
                          value={Math.min(row.percent, 100)}
                          className="h-1"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="gap-0 py-4">
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("reports.netWorthHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              {netWorthSeries.length < 2 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  {t("reports.noSnapshots")}
                </p>
              ) : (
                <ChartContainer config={netWorthConfig} className="h-56 w-full">
                  <AreaChart
                    data={netWorthSeries}
                    margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: string) => value.slice(5)}
                    />
                    <YAxis
                      width={52}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => compactMoney(value)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatMoney(Number(value))}
                        />
                      }
                    />
                    <Area
                      dataKey="netWorth"
                      type="monotone"
                      fill="var(--color-netWorth)"
                      fillOpacity={0.18}
                      stroke="var(--color-netWorth)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
