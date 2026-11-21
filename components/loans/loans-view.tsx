"use client";

import {
  CalendarClock,
  CreditCard,
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
import { useDeleteLoan, useLoans } from "@/hooks/use-loans";
import { formatDateMn, todayISO } from "@/lib/date";
import { formatMoney, toNumber } from "@/lib/finance/format";
import { calculateLoan } from "@/lib/finance/loan";
import { t } from "@/lib/i18n";
import type { LoanRow } from "@/types/entities";

import { LoanDialog } from "./loan-dialog";
import { LoanScheduleDialog } from "./loan-schedule-dialog";

export function LoansView() {
  const { data, isLoading, isError, error, refetch } = useLoans();
  const deleteLoan = useDeleteLoan();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LoanRow | null>(null);
  const [deleting, setDeleting] = React.useState<LoanRow | null>(null);
  const [viewing, setViewing] = React.useState<LoanRow | null>(null);

  const loans = React.useMemo(() => data ?? [], [data]);
  const today = todayISO();

  const totals = React.useMemo(() => {
    let principal = 0;
    let interest = 0;
    let outstanding = 0;
    let monthlyPayment = 0;
    let nextPayment: { dueDate: string; payment: number } | null = null;

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
      principal += toNumber(loan.principal);
      interest += summary.totalInterest;
      outstanding += summary.outstandingBalance;
      monthlyPayment += summary.payment;

      if (
        summary.nextPayment &&
        (!nextPayment || summary.nextPayment.dueDate < nextPayment.dueDate)
      ) {
        nextPayment = {
          dueDate: summary.nextPayment.dueDate,
          payment: summary.nextPayment.payment,
        };
      }
    }

    return { principal, interest, outstanding, monthlyPayment, nextPayment };
  }, [loans, today]);

  return (
    <>
      <PageHeader
        title={t("loans.title")}
        description={t("loans.subtitle")}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("loans.add")}
          </Button>
        }
      />

      {loans.length > 0 ? (
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">
                {t("loans.totalPrincipal")}
              </p>
              <Money
                amount={totals.principal}
                className="mt-1 block text-lg font-semibold"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("loans.count", { count: loans.length })}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">
                {t("loans.outstanding")}
              </p>
              <Money
                amount={totals.outstanding}
                tone="negative"
                className="mt-1 block text-lg font-semibold"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("loans.totalInterest")}: {formatMoney(totals.interest)}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">
                {t("loans.monthlyPayment")}
              </p>
              <Money
                amount={totals.monthlyPayment}
                className="mt-1 block text-lg font-semibold"
              />
            </CardContent>
          </Card>

          <Card className="gap-0 py-3">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">
                {t("loans.nextPayment")}
              </p>
              {totals.nextPayment ? (
                <>
                  <p className="mt-1 text-lg font-semibold">
                    {formatDateMn(totals.nextPayment.dueDate)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatMoney(totals.nextPayment.payment)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("loans.settled")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-lg" />
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
      ) : loans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t("loans.emptyTitle")}
          description={t("loans.emptyDescription")}
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t("loans.add")}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {loans.map((loan) => {
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

            return (
              <div key={loan.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                    <CreditCard className="size-4 text-muted-foreground" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{loan.lender}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {toNumber(loan.annual_rate)}% · {loan.term_months}{" "}
                      {t("loans.monthsShort")} ·{" "}
                      {loan.payment_type === "annuity"
                        ? t("loans.annuity")
                        : t("loans.equalPrincipal")}
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
                      <DropdownMenuItem onSelect={() => setViewing(loan)}>
                        <CalendarClock className="size-4" />
                        {t("loans.schedule")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(loan);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setDeleting(loan)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">
                      {t("loans.monthlyPayment")}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      <Money amount={summary.payment} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t("loans.outstanding")}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      <Money amount={summary.outstandingBalance} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t("loans.totalInterest")}
                    </dt>
                    <dd className="font-medium tabular-nums text-muted-foreground">
                      <Money amount={summary.totalInterest} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t("loans.payoffDate")}
                    </dt>
                    <dd className="font-medium">
                      {formatDateMn(summary.payoffDate)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2 text-xs">
                  <span className="text-muted-foreground">
                    {summary.nextPayment ? (
                      <>
                        {t("loans.nextPayment")}:{" "}
                        <span className="text-foreground">
                          {formatDateMn(summary.nextPayment.dueDate)}
                        </span>{" "}
                        ·{" "}
                        <Money amount={summary.nextPayment.payment} />
                      </>
                    ) : (
                      t("loans.settled")
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewing(loan)}
                  >
                    {t("loans.schedule")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LoanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        loan={editing}
      />

      <LoanScheduleDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        loan={viewing}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("loans.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("loans.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deleteLoan.mutate(deleting.id);
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
