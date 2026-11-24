"use client";

import {
  ChevronRight,
  HandCoins,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDebtPayments,
  useDebts,
  useDeleteDebt,
} from "@/hooks/use-debts";
import { useWallets } from "@/hooks/use-wallets";
import { formatDateMn, todayISO } from "@/lib/date";
import { getDebtProgress } from "@/lib/finance/debt";
import { t } from "@/lib/i18n";
import type { DebtType } from "@/lib/validation/debt";
import type { DebtBalanceRow, DebtPaymentRow } from "@/types/entities";

import { DebtDialog } from "./debt-dialog";
import { DebtPaymentDialog } from "./debt-payment-dialog";

export function DebtsView() {
  const { data, isLoading, isError, error, refetch } = useDebts();
  const { data: payments } = useDebtPayments();
  const { data: wallets } = useWallets();
  const deleteDebt = useDeleteDebt();

  const [tab, setTab] = React.useState<DebtType>("i_owe");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DebtBalanceRow | null>(null);
  const [deleting, setDeleting] = React.useState<DebtBalanceRow | null>(null);
  const [paying, setPaying] = React.useState<DebtBalanceRow | null>(null);

  const debts = React.useMemo(
    () => (data ?? []).filter((debt) => debt.type === tab),
    [data, tab],
  );

  const paymentsByDebt = React.useMemo(() => {
    const map = new Map<string, DebtPaymentRow[]>();
    for (const payment of payments ?? []) {
      const list = map.get(payment.debt_id) ?? [];
      list.push(payment);
      map.set(payment.debt_id, list);
    }
    return map;
  }, [payments]);

  const totals = React.useMemo(() => {
    let remaining = 0;
    let paid = 0;
    for (const debt of debts) {
      if (debt.status !== "paid") {
        remaining += Number(debt.remaining_amount);
      }
      paid += Number(debt.paid_amount);
    }
    return { remaining, paid };
  }, [debts]);

  return (
    <>
      <PageHeader
        title={t("debts.title")}
        description={t("debts.subtitle")}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("debts.add")}
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(next) => setTab(next as DebtType)}>
          <TabsList>
            <TabsTrigger value="i_owe">{t("debts.iOwe")}</TabsTrigger>
            <TabsTrigger value="owed_to_me">{t("debts.owedToMe")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            {t("debts.remaining")}:{" "}
            <Money amount={totals.remaining} className="font-medium text-foreground" />
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
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
      ) : debts.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={
            tab === "i_owe" ? t("debts.emptyOweTitle") : t("debts.emptyOwedTitle")
          }
          description={t("debts.emptyDescription")}
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t("debts.add")}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {debts.map((debt) => {
            const progress = getDebtProgress(
              {
                principal: debt.principal,
                paid: debt.paid_amount,
                dueDate: debt.due_date,
                status: debt.status,
              },
              todayISO(),
            );
            const settled = debt.status === "paid";

            return (
              <li key={debt.id} className="rounded-lg border px-3 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                    <HandCoins className="size-4 text-muted-foreground" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {debt.counterparty}
                      </p>
                      {settled ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-600/30 text-[11px] font-normal text-emerald-600 dark:text-emerald-400"
                        >
                          {t("debts.settled")}
                        </Badge>
                      ) : progress.isOverdue ? (
                        <Badge variant="destructive" className="text-[11px] font-normal">
                          {t("debts.overdue")}
                        </Badge>
                      ) : progress.isDueSoon ? (
                        <Badge
                          variant="outline"
                          className="border-amber-600/40 text-[11px] font-normal text-amber-600 dark:text-amber-400"
                        >
                          {t("debts.dueInDays", { days: progress.daysUntilDue ?? 0 })}
                        </Badge>
                      ) : debt.due_date && !settled ? (
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateMn(debt.due_date)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">
                      <span>
                        {t("debts.principal")}:{" "}
                        <Money amount={debt.principal} className="text-foreground" />
                      </span>
                      <span>
                        {t("debts.paid")}:{" "}
                        <Money amount={debt.paid_amount} />
                      </span>
                      <span>
                        {t("debts.remaining")}:{" "}
                        <Money
                          amount={debt.remaining_amount}
                          tone={settled ? "default" : "auto"}
                          className="text-foreground"
                        />
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Progress
                        value={Math.min(progress.percentPaid, 100)}
                        className="h-1.5 flex-1"
                      />
                      <span className="w-9 text-right text-[11px] text-muted-foreground tabular-nums">
                        {progress.percentPaid}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!settled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaying(debt)}
                      >
                        {t("debts.addPayment")}
                        <ChevronRight className="size-3.5" />
                      </Button>
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
                        <DropdownMenuItem onSelect={() => setPaying(debt)}>
                          <HandCoins className="size-4" />
                          {t("debts.payments")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(debt);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setDeleting(debt)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DebtDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        debt={editing}
        defaultType={tab}
      />

      <DebtPaymentDialog
        open={Boolean(paying)}
        onOpenChange={(open) => {
          if (!open) setPaying(null);
        }}
        debt={paying}
        payments={paying ? (paymentsByDebt.get(paying.id) ?? []) : []}
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
            <AlertDialogTitle>{t("debts.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("debts.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deleteDebt.mutate(deleting.id);
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
