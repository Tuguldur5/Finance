"use client";

import { MoreHorizontal, Pencil, Plus, Target, Trash2 } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/empty-state";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteGoal,
  useGoalContributions,
  useGoals,
} from "@/hooks/use-goals";
import { useWallets } from "@/hooks/use-wallets";
import { formatDateMn, todayISO } from "@/lib/date";
import { getGoalProgress, projectGoalCompletion } from "@/lib/finance/goal";
import { t } from "@/lib/i18n";
import type { GoalContributionRow, GoalRow } from "@/types/entities";

import { ContributionDialog } from "./contribution-dialog";
import { GoalDialog } from "./goal-dialog";

export function GoalsView() {
  const { data, isLoading, isError, error, refetch } = useGoals();
  const { data: contributions } = useGoalContributions();
  const { data: wallets } = useWallets();
  const deleteGoal = useDeleteGoal();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GoalRow | null>(null);
  const [deleting, setDeleting] = React.useState<GoalRow | null>(null);
  const [contributing, setContributing] = React.useState<GoalRow | null>(null);

  const goals = data ?? [];
  const today = todayISO();

  const contributionsByGoal = React.useMemo(() => {
    const map = new Map<string, GoalContributionRow[]>();
    for (const contribution of contributions ?? []) {
      const list = map.get(contribution.goal_id) ?? [];
      list.push(contribution);
      map.set(contribution.goal_id, list);
    }
    return map;
  }, [contributions]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <>
      <PageHeader
        title={t("goals.title")}
        description={t("goals.subtitle")}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {t("goals.add")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-lg" />
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
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t("goals.emptyTitle")}
          description={t("goals.emptyDescription")}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("goals.add")}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => {
            const progress = getGoalProgress(
              goal.target_amount,
              goal.current_amount,
            );
            const goalContributions = contributionsByGoal.get(goal.id) ?? [];
            const projection = projectGoalCompletion(
              goal.target_amount,
              goal.current_amount,
              goalContributions.map((contribution) => ({
                amount: contribution.amount,
                contributedAt: contribution.contributed_at,
              })),
              today,
            );

            return (
              <div
                key={goal.id}
                className="flex flex-col rounded-lg border p-4"
              >
                <div className="flex items-start gap-2">
                  <span
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: `${goal.color}1a`,
                      color: goal.color,
                    }}
                  >
                    <Target className="size-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.target_date
                        ? t("goals.targetDate") +
                          ": " +
                          formatDateMn(goal.target_date)
                        : t("common.allTime")}
                    </p>
                  </div>

                  {progress.isComplete ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-600/30 text-[11px] font-normal text-emerald-600 dark:text-emerald-400"
                    >
                      {t("goals.completed")}
                    </Badge>
                  ) : null}

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
                          setEditing(goal);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setDeleting(goal)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <Money
                      amount={goal.current_amount}
                      currency={goal.currency}
                      className="text-base font-semibold"
                    />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      / <Money amount={goal.target_amount} currency={goal.currency} />
                    </span>
                  </div>

                  <Progress value={progress.percent} className="mt-2 h-1.5" />

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="tabular-nums">{progress.percent}%</span>
                    <span className="tabular-nums">
                      {t("budgets.remainingLabel")}:{" "}
                      <Money amount={progress.remaining} currency={goal.currency} />
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t pt-2 text-[11px] text-muted-foreground">
                  {projection.projectedDate ? (
                    <p>
                      {t("goals.projectedDate")}:{" "}
                      <span className="text-foreground">
                        {formatDateMn(projection.projectedDate)}
                      </span>
                    </p>
                  ) : (
                    <p>{t("goals.noProjection")}</p>
                  )}
                  {projection.monthlyRate > 0 ? (
                    <p className="mt-0.5 tabular-nums">
                      {t("goals.monthlyRate")}:{" "}
                      <Money
                        amount={projection.monthlyRate}
                        currency={goal.currency}
                      />
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setContributing(goal)}
                  >
                    <Plus className="size-4" />
                    {t("goals.contribute")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editing}
      />

      <ContributionDialog
        open={Boolean(contributing)}
        onOpenChange={(open) => {
          if (!open) setContributing(null);
        }}
        goal={contributing}
        contributions={
          contributing ? (contributionsByGoal.get(contributing.id) ?? []) : []
        }
        wallets={wallets ?? []}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("goals.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("goals.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deleteGoal.mutate(deleting.id);
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
