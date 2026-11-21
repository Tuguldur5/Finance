"use client";

import { format, parseISO, subMonths } from "date-fns";
import { ArrowRight, CalendarClock, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { QuickAddButton } from "@/components/transactions/quick-add-button";
import { Badge } from "@/components/ui/badge";
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
import { useBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { useDebts } from "@/hooks/use-debts";
import { useGoalContributions, useGoals } from "@/hooks/use-goals";
import { useLoans } from "@/hooks/use-loans";
import { useSavingsAccounts } from "@/hooks/use-savings";
import {
  useCaptureSnapshot,
  useReportTransactions,
} from "@/hooks/use-reports";
import { useWallets } from "@/hooks/use-wallets";
import { formatDateShort, formatMonthNameMn, todayISO } from "@/lib/date";
import { getBudgetProgress } from "@/lib/finance/budget";
import { formatMoney, formatNumber, toNumber } from "@/lib/finance/format";
import { getGoalProgress, projectGoalCompletion } from "@/lib/finance/goal";
import { calculateLoan } from "@/lib/finance/loan";
import {
  getCashFlow,
  getCategoryBreakdown,
  getMonthlySeries,
  getNetWorth,
} from "@/lib/finance/stats";
import { t } from "@/lib/i18n";

const flowConfig = {
  income: { label: t("dashboard.incomeThisMonth"), color: "var(--chart-2)" },
  expense: { label: t("dashboard.expenseThisMonth"), color: "var(--chart-5)" },
} satisfies ChartConfig;

function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 1)}тэрбум`;
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}сая`;
  if (abs >= 10_000) return `${formatNumber(value / 1_000, 0)}мян`;
  return formatNumber(value);
}

export function DashboardView() {
  const today = todayISO();
  const monthStart = `${today.slice(0, 7)}-01`;
  const months = React.useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) =>
        format(subMonths(parseISO(today), 5 - index), "yyyy-MM"),
      ),
    [today],
  );

  const transactionsQuery = useReportTransactions(`${months[0]}-01`, today);
  const walletsQuery = useWallets();
  const categoriesQuery = useCategories();
  const budgetsQuery = useBudgets(monthStart);
  const goalsQuery = useGoals();
  const contributionsQuery = useGoalContributions();
  const debtsQuery = useDebts();
  const loansQuery = useLoans();
  const savingsQuery = useSavingsAccounts();
  const { mutate: captureSnapshot } = useCaptureSnapshot();

  const capturedRef = React.useRef(false);
  React.useEffect(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;
    captureSnapshot(today);
  }, [captureSnapshot, today]);

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
  const goals = React.useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);
  const contributions = React.useMemo(
    () => contributionsQuery.data ?? [],
    [contributionsQuery.data],
  );
  const debts = React.useMemo(() => debtsQuery.data ?? [], [debtsQuery.data]);
  const loans = React.useMemo(() => loansQuery.data ?? [], [loansQuery.data]);
  const savingsAccounts = React.useMemo(
    () => savingsQuery.data ?? [],
    [savingsQuery.data],
  );
  const budgets = React.useMemo(
    () => budgetsQuery.data ?? [],
    [budgetsQuery.data],
  );

  const categoriesById = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const monthTransactions = React.useMemo(
    () =>
      transactions.filter((transaction) =>
        transaction.occurred_at.startsWith(today.slice(0, 7)),
      ),
    [transactions, today],
  );

  const cashFlow = getCashFlow(monthTransactions);
  const trend = getMonthlySeries(transactions, months);

  const savingsTotal = savingsAccounts
    .filter((account) => !account.is_archived)
    .reduce((sum, account) => sum + toNumber(account.balance), 0);

  const assets =
    wallets
      .filter((wallet) => !wallet.is_archived)
      .reduce((sum, wallet) => sum + toNumber(wallet.balance), 0) +
    savingsTotal;

  const receivables = debts
    .filter((debt) => debt.type === "owed_to_me" && debt.status !== "paid")
    .reduce((sum, debt) => sum + toNumber(debt.remaining_amount), 0);

  const payables = debts
    .filter((debt) => debt.type === "i_owe" && debt.status !== "paid")
    .reduce((sum, debt) => sum + toNumber(debt.remaining_amount), 0);

  const loanOutstanding = loans.reduce((sum, loan) => {
    const summary = calculateLoan(
      {
        principal: toNumber(loan.principal),
        annualRate: toNumber(loan.annual_rate),
        termMonths: loan.term_months,
        startDate: loan.start_date,
        paymentType: loan.payment_type,
      },
      today,
    );
    return sum + summary.outstandingBalance;
  }, 0);

  const netWorth = getNetWorth(assets + receivables, payables + loanOutstanding);

  const breakdown = getCategoryBreakdown(monthTransactions, "expense");
  const donutData = React.useMemo(() => {
    const top = breakdown.slice(0, 5);
    const rest = breakdown.slice(5).reduce((sum, row) => sum + row.amount, 0);
    const rows = top.map((row, index) => {
      const category = row.categoryId
        ? categoriesById.get(row.categoryId)
        : undefined;
      return {
        name: category?.name ?? t("common.unknown"),
        value: row.amount,
        fill: category?.color ?? `var(--chart-${(index % 5) + 1})`,
      };
    });
    if (rest > 0) {
      rows.push({
        name: t("dashboard.otherCategories"),
        value: rest,
        fill: "var(--chart-4)",
      });
    }
    return rows;
  }, [breakdown, categoriesById]);

  const budgetRows = React.useMemo(
    () =>
      [...budgets]
        .map((budget) => ({
          budget,
          category: categoriesById.get(budget.category_id),
          progress: getBudgetProgress(budget.amount, budget.spent),
        }))
        .sort((a, b) => b.progress.percentUsed - a.progress.percentUsed)
        .slice(0, 5),
    [budgets, categoriesById],
  );

  const goalRows = React.useMemo(
    () =>
      [...goals]
        .map((goal) => {
          const goalContributions = contributions
            .filter((contribution) => contribution.goal_id === goal.id)
            .map((contribution) => ({
              amount: contribution.amount,
              contributedAt: contribution.contributed_at,
            }));
          return {
            goal,
            progress: getGoalProgress(goal.target_amount, goal.current_amount),
            projection: projectGoalCompletion(
              goal.target_amount,
              goal.current_amount,
              goalContributions,
              today,
            ),
          };
        })
        .sort((a, b) => b.progress.percent - a.progress.percent)
        .slice(0, 4),
    [goals, contributions, today],
  );

  const upcoming = React.useMemo(() => {
    const items: { id: string; label: string; date: string; amount: number }[] =
      [];

    for (const debt of debts) {
      if (debt.status === "paid" || !debt.due_date) continue;
      items.push({
        id: `debt-${debt.id}`,
        label: debt.counterparty,
        date: debt.due_date,
        amount: toNumber(debt.remaining_amount),
      });
    }

    for (const loan of loans) {
      const summary = calculateLoan(
        {
          principal: toNumber(loan.principal),
          annualRate: toNumber(loan.annual_rate),
          termMonths: loan.term_months,
          startDate: loan.start_date,
          paymentType: loan.payment_type,
        },
        today,
      );
      if (!summary.nextPayment) continue;
      items.push({
        id: `loan-${loan.id}`,
        label: loan.lender,
        date: summary.nextPayment.dueDate,
        amount: summary.nextPayment.payment,
      });
    }

    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [debts, loans, today]);

  const recent = transactions.slice(0, 6);

  const isLoading =
    transactionsQuery.isLoading ||
    walletsQuery.isLoading ||
    budgetsQuery.isLoading ||
    savingsQuery.isLoading;

  const hasData = transactions.length > 0 || wallets.length > 0;

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        description={t("app.description")}
        actions={<QuickAddButton withLabel />}
      />

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            <Skeleton className="h-72 w-full rounded-lg lg:col-span-3" />
            <Skeleton className="h-72 w-full rounded-lg lg:col-span-2" />
          </div>
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={LayoutDashboard}
          title={t("empty.title")}
          description={t("dashboard.emptyState")}
          action={<QuickAddButton withLabel />}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.netWorth")}
                </p>
                <Money
                  amount={netWorth.netWorth}
                  tone="auto"
                  className="mt-1 block text-lg font-semibold"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("dashboard.assets")}: {compactMoney(netWorth.assets)} ·{" "}
                  {t("dashboard.liabilities")}:{" "}
                  {compactMoney(netWorth.liabilities)}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.incomeThisMonth")}
                </p>
                <Money
                  amount={cashFlow.income}
                  className="mt-1 block text-lg font-semibold"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatMonthNameMn(today)}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.expenseThisMonth")}
                </p>
                <Money
                  amount={cashFlow.expense}
                  className="mt-1 block text-lg font-semibold"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("dashboard.net")}: {compactMoney(cashFlow.net)}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 py-3">
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.savingsRate")}
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
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">
                    {t("dashboard.cashFlow")}
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground">
                    {t("dashboard.lastSixMonths")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-2">
                <ChartContainer config={flowConfig} className="h-56 w-full">
                  <AreaChart
                    data={trend}
                    margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="bucket"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: string) => `${Number(value.slice(5))}`}
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
                      dataKey="income"
                      type="monotone"
                      fill="var(--color-income)"
                      fillOpacity={0.18}
                      stroke="var(--color-income)"
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="expense"
                      type="monotone"
                      fill="var(--color-expense)"
                      fillOpacity={0.14}
                      stroke="var(--color-expense)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4 lg:col-span-2">
              <CardHeader className="px-4 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.spendingByCategory")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                {donutData.length === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    {t("reports.noData")}
                  </p>
                ) : (
                  <>
                    <ChartContainer
                      config={{}}
                      className="mx-auto h-40 w-full max-w-56"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              nameKey="name"
                              formatter={(value) => formatMoney(Number(value))}
                            />
                          }
                        />
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={68}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {donutData.map((row) => (
                            <Cell key={row.name} fill={row.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>

                    <ul className="mt-1 space-y-1">
                      {donutData.map((row) => (
                        <li
                          key={row.name}
                          className="flex items-center gap-2 text-[11px]"
                        >
                          <span
                            className="size-2 shrink-0 rounded-sm"
                            style={{ backgroundColor: row.fill }}
                          />
                          <span className="min-w-0 flex-1 truncate text-muted-foreground">
                            {row.name}
                          </span>
                          <span className="tabular-nums">
                            <Money amount={row.value} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="gap-0 py-4">
              <CardHeader className="px-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t("dashboard.budgetProgress")}
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/app/budgets">
                      {t("common.viewAll")}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4">
                {budgetRows.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    {t("dashboard.noBudget")}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {budgetRows.map(({ budget, category, progress }) => (
                      <li key={budget.id}>
                        <div className="mb-1 flex items-center gap-2 text-xs">
                          <span className="min-w-0 flex-1 truncate">
                            {category?.name ?? t("common.unknown")}
                          </span>
                          {progress.isOverBudget ? (
                            <Badge
                              variant="outline"
                              className="border-destructive/40 px-1 py-0 text-[10px] font-normal text-destructive"
                            >
                              {t("budgets.overBudget")}
                            </Badge>
                          ) : null}
                          <span className="tabular-nums text-muted-foreground">
                            <Money amount={progress.spent} /> /{" "}
                            <Money amount={progress.amount} />
                          </span>
                        </div>
                        <Progress
                          value={Math.min(progress.percentUsed, 100)}
                          className="h-1"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="gap-0 py-4">
              <CardHeader className="px-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t("dashboard.goalsProgress")}
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/app/goals">
                      {t("common.viewAll")}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4">
                {goalRows.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    {t("dashboard.noGoals")}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {goalRows.map(({ goal, progress }) => (
                      <li key={goal.id}>
                        <div className="mb-1 flex items-center gap-2 text-xs">
                          <span className="min-w-0 flex-1 truncate">
                            {goal.name}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {progress.percent}%
                          </span>
                        </div>
                        <Progress value={progress.percent} className="h-1" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="gap-0 py-4">
              <CardHeader className="px-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t("dashboard.recentTransactions")}
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/app/transactions">
                      {t("common.viewAll")}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4">
                <ul className="divide-y">
                  {recent.map((transaction) => {
                    const category = transaction.category_id
                      ? categoriesById.get(transaction.category_id)
                      : undefined;
                    return (
                      <li
                        key={transaction.id}
                        className="flex items-center gap-2 py-1.5 text-xs"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: category?.color ?? "#64748b" }}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {category?.name ?? transaction.note ?? t("common.unknown")}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDateShort(transaction.occurred_at)}
                        </span>
                        <Money
                          amount={transaction.amount}
                          tone={transaction.type === "income" ? "positive" : "default"}
                          className="shrink-0"
                        />
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4">
              <CardHeader className="px-4 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.upcomingPayments")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                {upcoming.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    {t("dashboard.noUpcoming")}
                  </p>
                ) : (
                  <ul className="divide-y">
                    {upcoming.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 py-1.5 text-xs"
                      >
                        <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDateShort(item.date)}
                        </span>
                        <Money amount={item.amount} className="shrink-0" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
