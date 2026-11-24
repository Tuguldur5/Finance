"use client";

import {
  BarChart3,
  Coins,
  Landmark,
  Minus,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteSavingsAccount,
  useSavingsAccounts,
} from "@/hooks/use-savings";
import { formatDateMn } from "@/lib/date";
import { sumMoney, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  SavingsAccountRow,
  SavingsAccountType,
  SavingsLiquidity,
} from "@/types/entities";

import { SavingsBalanceDialog } from "./savings-balance-dialog";
import { SavingsDialog } from "./savings-dialog";

const TYPE_ICONS = {
  savings: PiggyBank,
  investment: TrendingUp,
  bond: Landmark,
  stock: BarChart3,
  other: Coins,
} satisfies Record<SavingsAccountType, typeof PiggyBank>;

function liquidityBadgeClass(liquidity: SavingsLiquidity): string {
  if (liquidity === "instant") {
    return "border-emerald-600/30 text-emerald-700 dark:text-emerald-400";
  }
  if (liquidity === "term") {
    return "border-amber-600/30 text-amber-700 dark:text-amber-400";
  }
  return "border-violet-600/30 text-violet-700 dark:text-violet-400";
}

export function SavingsView() {
  const { data, isLoading, isError, error, refetch } = useSavingsAccounts();
  const deleteAccount = useDeleteSavingsAccount();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SavingsAccountRow | null>(null);
  const [deleting, setDeleting] = React.useState<SavingsAccountRow | null>(null);
  const [adjusting, setAdjusting] = React.useState<{
    account: SavingsAccountRow;
    direction: "deposit" | "withdraw";
  } | null>(null);

  const accounts = React.useMemo(() => data ?? [], [data]);

  const totals = React.useMemo(() => {
    const instant = accounts.filter(
      (account) => account.liquidity === "instant",
    );
    const term = accounts.filter((account) => account.liquidity === "term");
    const longTerm = accounts.filter(
      (account) => account.liquidity === "long_term",
    );

    return {
      all: sumMoney(accounts.map((account) => account.balance)),
      instant: sumMoney(instant.map((account) => account.balance)),
      term: sumMoney(term.map((account) => account.balance)),
      longTerm: sumMoney(longTerm.map((account) => account.balance)),
    };
  }, [accounts]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <>
      <PageHeader
        title={t("savings.title")}
        description={t("savings.subtitle")}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {t("savings.add")}
          </Button>
        }
      />

      {accounts.length > 0 ? (
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">
                {t("savings.total")}
              </p>
              <Money
                amount={totals.all}
                className="mt-1 block text-lg font-semibold"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("savings.count", { count: accounts.length })}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">
                {t("savings.instantTotal")}
              </p>
              <Money
                amount={totals.instant}
                className="mt-1 block text-lg font-semibold text-emerald-700 dark:text-emerald-400"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("savings.liquidityOptions.instant")}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">
                {t("savings.termTotal")}
              </p>
              <Money
                amount={totals.term}
                className="mt-1 block text-lg font-semibold text-amber-700 dark:text-amber-400"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("savings.liquidityOptions.term")}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">
                {t("savings.longTermTotal")}
              </p>
              <Money
                amount={totals.longTerm}
                className="mt-1 block text-lg font-semibold text-violet-700 dark:text-violet-400"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("savings.liquidityOptions.long_term")}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-lg" />
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
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={t("savings.emptyTitle")}
          description={t("savings.emptyDescription")}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("savings.add")}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {accounts.map((account) => {
            const Icon = TYPE_ICONS[account.type];
            const rate = toNumber(account.expected_rate);
            const balance = toNumber(account.balance);

            return (
              <div
                key={account.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                    <Icon className="size-4 text-muted-foreground" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{account.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {account.institution || t(`savings.types.${account.type}`)}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[11px] font-normal",
                      liquidityBadgeClass(account.liquidity),
                    )}
                  >
                    {t(`savings.liquidityOptions.${account.liquidity}`)}
                  </Badge>

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
                          setEditing(account);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setDeleting(account)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4">
                  <Money
                    amount={account.balance}
                    currency={account.currency}
                    className="text-xl font-semibold"
                  />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`savings.types.${account.type}`)}
                    {rate > 0
                      ? ` · ${t("savings.rateHint", { rate })}`
                      : ""}
                  </p>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">
                      {t("savings.liquidity")}
                    </dt>
                    <dd className="font-medium">
                      {t(`savings.liquidityOptions.${account.liquidity}`)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t("savings.maturityDate")}
                    </dt>
                    <dd className="font-medium">
                      {account.maturity_date
                        ? formatDateMn(account.maturity_date)
                        : t("common.notSet")}
                    </dd>
                  </div>
                </dl>

                {account.note ? (
                  <p className="mt-3 truncate text-xs text-muted-foreground">
                    {account.note}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setAdjusting({ account, direction: "deposit" })
                    }
                  >
                    <Plus className="size-4" />
                    {t("savings.deposit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={balance <= 0}
                    onClick={() =>
                      setAdjusting({ account, direction: "withdraw" })
                    }
                  >
                    <Minus className="size-4" />
                    {t("savings.withdraw")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SavingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editing}
      />

      <SavingsBalanceDialog
        open={Boolean(adjusting)}
        onOpenChange={(open) => {
          if (!open) setAdjusting(null);
        }}
        account={adjusting?.account ?? null}
        direction={adjusting?.direction ?? "deposit"}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("savings.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("savings.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deleteAccount.mutate(deleting.id);
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
