"use client";

import { ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
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

import { Money } from "@/components/money";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { formatDateShort, formatMonthMn, todayISO } from "@/lib/date";
import { compactMoney, formatNumber, roundMoney } from "@/lib/finance/format";
import {
  aggregateByYear,
  summarize,
  type LoanPaymentType,
  type LoanScheduleRow,
  type LoanYearRow,
} from "@/lib/finance/loan";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MONTHS_PER_PAGE = 12;
const YEARS_PER_PAGE = 12;

const chartConfig = {
  principal: {
    label: t("loanResult.principal"),
    color: "var(--chart-1)",
  },
  interest: {
    label: t("loanResult.interest"),
    color: "var(--chart-4)",
  },
  balance: {
    label: t("loanResult.balance"),
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type MonthlyPoint = LoanScheduleRow;

function monthLabel(month: number): string {
  return t("loanResult.monthNumber", { month });
}

function dueDateLabel(dueDate: string): string {
  return format(parseISO(dueDate), "yyyy 'оны' MM 'сар'");
}

function MonthlyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: MonthlyPoint }>;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="min-w-44 rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium">
        {monthLabel(row.month)} · {dueDateLabel(row.dueDate)}
      </p>
      <dl className="mt-1.5 grid gap-1">
        <TooltipRow label={t("loanResult.payment")} amount={row.payment} />
        <TooltipRow label={t("loanResult.principal")} amount={row.principal} />
        <TooltipRow
          label={t("loanResult.interest")}
          amount={row.interest}
        />
        <TooltipRow label={t("loanResult.balance")} amount={row.balance} />
      </dl>
    </div>
  );
}

function YearlyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: LoanYearRow }>;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="min-w-44 rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium">
        {t("loanResult.yearTitle", { year: row.year })} ·{" "}
        {t("loanResult.monthsCount", { count: row.months.length })}
      </p>
      <dl className="mt-1.5 grid gap-1">
        <TooltipRow label={t("loanResult.payment")} amount={row.payment} />
        <TooltipRow label={t("loanResult.principal")} amount={row.principal} />
        <TooltipRow
          label={t("loanResult.interest")}
          amount={row.interest}
        />
        <TooltipRow label={t("loanResult.balance")} amount={row.balance} />
        <TooltipRow
          label={t("loanResult.averageMonthly")}
          amount={row.averagePayment}
        />
      </dl>
    </div>
  );
}

function BalanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: MonthlyPoint }>;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted-foreground">
        {monthLabel(row.month)} · {dueDateLabel(row.dueDate)}
      </p>
      <p className="mt-0.5 font-medium tabular-nums">
        <Money amount={row.balance} />
      </p>
    </div>
  );
}

function TooltipRow({
  label,
  amount,
  percent,
}: {
  label: string;
  amount?: number;
  percent?: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">
        {percent !== undefined ? (
          `${formatNumber(percent, 1)}%`
        ) : (
          <Money amount={amount} />
        )}
      </dd>
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-28">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-xs font-medium tabular-nums">{children}</dd>
    </div>
  );
}

function ChartCard({
  view,
  onViewChange,
  children,
}: {
  view: "month" | "year";
  onViewChange: (view: "month" | "year") => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-md border p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium">{t("loanResult.chartTitle")}</h3>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={view}
          onValueChange={(value) => {
            if (value === "month" || value === "year") onViewChange(value);
          }}
          aria-label={t("loanResult.chartTitle")}
        >
          <ToggleGroupItem value="month" className="text-xs">
            {t("loanResult.monthly")}
          </ToggleGroupItem>
          <ToggleGroupItem value="year" className="text-xs">
            {t("loanResult.yearly")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {children}
    </div>
  );
}

type LoanResultProps = {
  schedule: LoanScheduleRow[];
  paymentType: LoanPaymentType;
  /** Used to highlight the current month. Defaults to today. */
  asOf?: string;
  className?: string;
};

/**
 * Loan amortization result: headline payment, totals, monthly/yearly chart,
 * and a paginated schedule. Shared by `/calculators/loan`, `/calculators/mortgage`
 * and the loans page in the app.
 */
export function LoanResult({
  schedule,
  paymentType,
  asOf = todayISO(),
  className,
}: LoanResultProps) {
  const [view, setView] = React.useState<"month" | "year">("month");
  const [monthPage, setMonthPage] = React.useState(1);
  const [yearPage, setYearPage] = React.useState(1);
  const [openYear, setOpenYear] = React.useState<number | null>(null);

  const stats = React.useMemo(() => summarize(schedule), [schedule]);
  const years = React.useMemo(() => aggregateByYear(schedule), [schedule]);

  React.useEffect(() => {
    setMonthPage(1);
    setYearPage(1);
    setOpenYear(null);
  }, [schedule.length, view]);

  const longTerm = schedule.length > 120;
  const isEqualPrincipal = paymentType === "equal_principal";

  const monthlyDecrease = React.useMemo(() => {
    if (!isEqualPrincipal || schedule.length === 0) return 0;

    const monthlyRate =
      stats.totalPrincipal > 0
        ? schedule[0].interest / stats.totalPrincipal
        : 0;

    return roundMoney(schedule[0].principal * monthlyRate);
  }, [isEqualPrincipal, schedule, stats.totalPrincipal]);

  const yearTicks = React.useMemo(() => {
    const ticks: number[] = [];
    for (let month = 1; month <= schedule.length; month += 12) {
      ticks.push(month);
    }
    return ticks;
  }, [schedule.length]);

  const currentMonthKey = asOf.slice(0, 7);
  const currentIndex = schedule.findIndex(
    (row) => row.dueDate.slice(0, 7) === currentMonthKey,
  );

  if (schedule.length === 0) {
    return (
      <p className={cn("py-6 text-center text-xs text-muted-foreground", className)}>
        {t("loanResult.empty")}
      </p>
    );
  }

  const monthPageCount = Math.max(
    1,
    Math.ceil(schedule.length / MONTHS_PER_PAGE),
  );
  const safeMonthPage = Math.min(monthPage, monthPageCount);
  const monthRows = schedule.slice(
    (safeMonthPage - 1) * MONTHS_PER_PAGE,
    safeMonthPage * MONTHS_PER_PAGE,
  );

  const yearPageCount = Math.max(1, Math.ceil(years.length / YEARS_PER_PAGE));
  const safeYearPage = Math.min(yearPage, yearPageCount);
  const yearRows = years.slice(
    (safeYearPage - 1) * YEARS_PER_PAGE,
    safeYearPage * YEARS_PER_PAGE,
  );

  return (
    <div className={className}>
      {/* Key number */}
      <div>
        <p className="text-xs text-muted-foreground">
          {isEqualPrincipal
            ? t("loanResult.firstPayment")
            : t("loanResult.monthlyPayment")}
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
          <Money amount={stats.firstPayment} />
        </p>
        {isEqualPrincipal ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("loanResult.lastMonth")}: <Money amount={stats.lastPayment} />
            {monthlyDecrease > 0 ? (
              <>
                {" · "}
                {t("loanResult.perMonthDecrease")}
                <Money amount={monthlyDecrease} />
                {t("loanResult.decreaseSuffix")}
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      {/* Secondary stats */}
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-y py-3">
        <Stat label={t("loanResult.totalInterest")}>
          <Money amount={stats.totalInterest} />
        </Stat>
        <Stat label={t("loanResult.totalPayment")}>
          <Money amount={stats.totalPayment} />
        </Stat>
        <Stat label={t("loanResult.payoffMonth")}>
          {formatMonthMn(stats.payoffDate)}
        </Stat>
        <Stat label={t("loanResult.paymentCount")}>
          {stats.paymentCount}
        </Stat>
        <Stat label={t("loanResult.principalShare")}>
          {formatNumber(stats.principalShare, 1)}%
        </Stat>
      </dl>

      <ChartCard view={view} onViewChange={setView}>
        {view === "month" ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart
              data={schedule}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              barCategoryGap={longTerm ? 0 : "12%"}
              barGap={0}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                ticks={yearTicks}
                interval={0}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                minTickGap={8}
                tickFormatter={(value: number) =>
                  t("loanResult.loanYear", { n: Math.ceil(value / 12) })
                }
              />
              <YAxis
                width={52}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => compactMoney(value)}
              />
              <ChartTooltip
                cursor={{ fill: "var(--accent)" }}
                content={<MonthlyTooltip />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="principal"
                stackId="loan"
                fill="var(--color-principal)"
                isAnimationActive={false}
              />
              <Bar
                dataKey="interest"
                stackId="loan"
                fill="var(--color-interest)"
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart
              data={years}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              barCategoryGap="18%"
              barGap={0}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tickFormatter={(value: number) => String(value)}
              />
              <YAxis
                width={52}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => compactMoney(value)}
              />
              <ChartTooltip
                cursor={{ fill: "var(--accent)" }}
                content={<YearlyTooltip />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="principal"
                stackId="loan"
                fill="var(--color-principal)"
                isAnimationActive={false}
              />
              <Bar
                dataKey="interest"
                stackId="loan"
                fill="var(--color-interest)"
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        )}

        <div className="mt-3 border-t pt-2">
          <p className="mb-1 text-[11px] text-muted-foreground">
            {t("loanResult.balanceTitle")}
          </p>
          <ChartContainer config={chartConfig} className="h-16 w-full">
            <AreaChart data={schedule} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <ChartTooltip content={<BalanceTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                fill="var(--color-balance)"
                fillOpacity={0.15}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </ChartCard>

      {view === "month" ? (
        <div className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-3">{t("loanResult.month")}</TableHead>
                  <TableHead>{t("loanResult.date")}</TableHead>
                  <TableHead className="text-right">
                    {t("loanResult.payment")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("loanResult.principal")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("loanResult.interest")}
                  </TableHead>
                  <TableHead className="pr-3 text-right">
                    {t("loanResult.balance")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthRows.map((row) => {
                  const index = row.month - 1;
                  const isCurrent = index === currentIndex;

                  return (
                    <TableRow
                      key={row.month}
                      className={cn(isCurrent && "bg-primary/5 hover:bg-primary/5")}
                    >
                      <TableCell className="pl-3 text-xs text-muted-foreground tabular-nums">
                        {row.month}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateShort(row.dueDate)}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        <Money amount={row.payment} />
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        <Money amount={row.principal} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                        <Money amount={row.interest} />
                      </TableCell>
                      <TableCell className="pr-3 text-right text-xs tabular-nums">
                        <Money amount={row.balance} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {monthPageCount > 1 ? (
            <Pagination className="mt-3">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    label={t("loanResult.previous")}
                    disabled={safeMonthPage <= 1}
                    onClick={() => setMonthPage((page) => Math.max(1, page - 1))}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-xs text-muted-foreground tabular-nums">
                    {t("loanResult.pageOf", {
                      page: safeMonthPage,
                      pages: monthPageCount,
                    })}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    label={t("loanResult.next")}
                    disabled={safeMonthPage >= monthPageCount}
                    onClick={() =>
                      setMonthPage((page) => Math.min(monthPageCount, page + 1))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          <div className="overflow-hidden rounded-md border text-xs">
            <div className="grid grid-cols-[1.25rem_3.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground">
              <span />
              <span>{t("loanResult.year")}</span>
              <span className="text-right">{t("loanResult.payment")}</span>
              <span className="text-right">{t("loanResult.principal")}</span>
              <span className="text-right">{t("loanResult.interest")}</span>
              <span className="text-right">{t("loanResult.balance")}</span>
            </div>

            {yearRows.map((year) => {
              const open = openYear === year.year;

              return (
                <Collapsible
                  key={year.year}
                  open={open}
                  onOpenChange={(next) =>
                    setOpenYear(next ? year.year : null)
                  }
                >
                  <CollapsibleTrigger
                    className="grid w-full grid-cols-[1.25rem_3.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted/50"
                    aria-label={t("loanResult.expandYear")}
                  >
                    <ChevronRight
                      className={cn(
                        "size-3.5 text-muted-foreground transition-transform duration-150",
                        open && "rotate-90",
                      )}
                    />
                    <span className="text-xs font-medium tabular-nums">
                      {year.year}
                    </span>
                    <span className="text-right tabular-nums">
                      <Money amount={year.payment} />
                    </span>
                    <span className="text-right tabular-nums">
                      <Money amount={year.principal} />
                    </span>
                    <span className="text-right text-muted-foreground tabular-nums">
                      <Money amount={year.interest} />
                    </span>
                    <span className="text-right tabular-nums">
                      <Money amount={year.balance} />
                    </span>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-b bg-muted/20 px-3 py-2 last:border-b-0">
                      <div className="mb-1 grid grid-cols-[2rem_minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] gap-2 px-1 text-[11px] text-muted-foreground">
                        <span>{t("loanResult.month")}</span>
                        <span>{t("loanResult.date")}</span>
                        <span className="text-right">{t("loanResult.payment")}</span>
                        <span className="text-right">{t("loanResult.principal")}</span>
                        <span className="text-right">{t("loanResult.interest")}</span>
                        <span className="text-right">{t("loanResult.balance")}</span>
                      </div>
                      {year.months.map((row) => (
                        <div
                          key={row.month}
                          className="grid grid-cols-[2rem_minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] gap-2 border-t border-border/40 px-1 py-1 text-[11px] tabular-nums first:border-t-0"
                        >
                          <span className="text-muted-foreground">{row.month}</span>
                          <span>{formatDateShort(row.dueDate)}</span>
                          <span className="text-right">
                            <Money amount={row.payment} />
                          </span>
                          <span className="text-right">
                            <Money amount={row.principal} />
                          </span>
                          <span className="text-right text-muted-foreground">
                            <Money amount={row.interest} />
                          </span>
                          <span className="text-right">
                            <Money amount={row.balance} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {yearPageCount > 1 ? (
            <Pagination className="mt-3">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    label={t("loanResult.previous")}
                    disabled={safeYearPage <= 1}
                    onClick={() => setYearPage((page) => Math.max(1, page - 1))}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-xs text-muted-foreground tabular-nums">
                    {t("loanResult.pageOf", {
                      page: safeYearPage,
                      pages: yearPageCount,
                    })}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    label={t("loanResult.next")}
                    disabled={safeYearPage >= yearPageCount}
                    onClick={() =>
                      setYearPage((page) => Math.min(yearPageCount, page + 1))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      )}
    </div>
  );
}
