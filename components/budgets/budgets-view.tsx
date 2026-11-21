"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Pencil,
  PieChart,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import * as React from "react";

import { EmptyState } from "@/components/empty-state";
import { EntityIcon } from "@/components/entity-icon";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBudgets,
  useCopyBudgets,
  useDeleteBudget,
  type BudgetWithSpent,
} from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { formatMonthMn, todayISO } from "@/lib/date";
import { getBudgetProgress, getBudgetTotals } from "@/lib/finance/budget";
import { t } from "@/lib/i18n";
import type { CategoryRow } from "@/types/entities";

import { BudgetDialog } from "./budget-dialog";

function monthKeyOf(date: Date): string {
  return format(date, "yyyy-MM-01");
}

export function BudgetsView() {
  const [month, setMonth] = React.useState(() => {
    const today = new Date(todayISO());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BudgetWithSpent | null>(null);
  const [deleting, setDeleting] = React.useState<BudgetWithSpent | null>(null);

  const monthKey = monthKeyOf(month);
  const { data: budgets, isLoading, isError, error, refetch } =
    useBudgets(monthKey);
  const { data: categories } = useCategories();
  const copyBudgets = useCopyBudgets();
  const deleteBudget = useDeleteBudget();

  const categoriesById = React.useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  const rows = budgets ?? [];
  const totals = getBudgetTotals(
    rows.map((budget) => ({ amount: budget.amount, spent: budget.spent })),
  );

  function shiftMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  const isCurrentMonth =
    monthKey === monthKeyOf(new Date(todayISO()));

  return (
    <>
      <PageHeader
        title={t("budgets.title")}
        description={t("budgets.subtitle")}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {t("budgets.add")}
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => shiftMonth(-1)}
            aria-label={t("common.back")}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 px-1 text-center text-sm font-medium">
            {formatMonthMn(month)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => shiftMonth(1)}
            aria-label={t("common.next")}
          >
            <ChevronRight className="size-4" />
          </Button>
          {!isCurrentMonth ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date(todayISO());
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
            >
              {t("common.today")}
            </Button>
          ) : null}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => copyBudgets.mutate(monthKey)}
          disabled={copyBudgets.isPending}
        >
          <Copy className="size-4" />
          {t("budgets.copyLastMonth")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : t("errors.loadFailed")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void refetch()}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title={t("budgets.emptyTitle")}
          description={t("budgets.emptyDescription")}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("budgets.add")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("budgets.totalBudget")}
                  </p>
                  <Money
                    amount={totals.amount}
                    className="mt-1 block text-base font-semibold"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("budgets.totalSpent")}
                  </p>
                  <Money
                    amount={totals.spent}
                    tone={totals.isOverBudget ? "negative" : "default"}
                    className="mt-1 block text-base font-semibold"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("budgets.remainingLabel")}
                  </p>
                  <Money
                    amount={totals.remaining}
                    tone="auto"
                    className="mt-1 block text-base font-semibold"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <Progress
                  value={Math.min(totals.percentUsed, 100)}
                  className="h-1.5"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span>{totals.percentUsed}%</span>
                  {totals.isOverBudget ? (
                    <span className="text-destructive">
                      {t("budgets.overspentBy", {
                        amount: new Intl.NumberFormat("en-US").format(
                          Math.abs(totals.remaining),
                        ),
                      })}
                    </span>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <ul className="divide-y rounded-lg border">
            {rows.map((budget) => {
              const category = categoriesById.get(budget.category_id);
              const progress = getBudgetProgress(budget.amount, budget.spent);
              const color = category?.color ?? "#64748b";

              return (
                <li
                  key={budget.id}
                  className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap"
                >
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-md border"
                    style={{
                      backgroundColor: `${color}1a`,
                      color,
                      borderColor: `${color}33`,
                    }}
                  >
                    <EntityIcon
                      name={category?.icon ?? "circle"}
                      className="size-4"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {category?.name ?? t("common.unknown")}
                      </p>
                      {progress.isOverBudget ? (
                        <Badge
                          variant="outline"
                          className="border-destructive/40 px-1.5 py-0 text-[10px] font-normal text-destructive"
                        >
                          {t("budgets.overspentBy", {
                            amount: new Intl.NumberFormat("en-US").format(
                              progress.overspend,
                            ),
                          })}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress
                        value={Math.min(progress.percentUsed, 100)}
                        className="h-1.5 flex-1"
                      />
                      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                        {progress.percentUsed}%
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      <Money amount={progress.spent} /> /{" "}
                      <Money amount={progress.amount} />
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("common.actions")}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(budget);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setDeleting(budget)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        month={monthKey}
        categories={(categories ?? []).filter(
          (category: CategoryRow) => category.type === "expense",
        )}
        budget={editing}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("budgets.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("budgets.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deleteBudget.mutate(deleting.id);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
