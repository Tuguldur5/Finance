"use client";

import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDateMn, todayISO } from "@/lib/date";
import { calculateLoan } from "@/lib/finance/loan";
import { toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import type { LoanRow } from "@/types/entities";

function ScheduleContent({
  loan,
  onDone,
}: {
  loan: LoanRow;
  onDone: () => void;
}) {
  const summary = calculateLoan(
    {
      principal: toNumber(loan.principal),
      annualRate: toNumber(loan.annual_rate),
      termMonths: loan.term_months,
      startDate: loan.start_date,
      paymentType: loan.payment_type,
    },
    todayISO(),
  );

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 px-3 py-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">{t("loans.monthlyPayment")}</dt>
          <dd className="mt-0.5 font-medium">
            <Money amount={summary.payment} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("loans.totalInterest")}</dt>
          <dd className="mt-0.5 font-medium">
            <Money amount={summary.totalInterest} tone="negative" />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("loans.totalPayment")}</dt>
          <dd className="mt-0.5 font-medium">
            <Money amount={summary.totalPayment} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("loans.payoffDate")}</dt>
          <dd className="mt-0.5 font-medium">
            {formatDateMn(summary.payoffDate)}
          </dd>
        </div>
      </dl>

      <div className="max-h-[45vh] overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-10">{t("loans.month")}</TableHead>
              <TableHead>{t("loans.dueDate")}</TableHead>
              <TableHead className="text-right">{t("loans.payment")}</TableHead>
              <TableHead className="text-right">
                {t("loans.principalPart")}
              </TableHead>
              <TableHead className="text-right">
                {t("loans.interestPart")}
              </TableHead>
              <TableHead className="text-right">{t("loans.balance")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.schedule.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {row.month}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {formatDateMn(row.dueDate)}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  <Money amount={row.payment} />
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  <Money amount={row.principal} />
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                  <Money amount={row.interest} />
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  <Money amount={row.balance} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onDone}>
          {t("common.close")}
        </Button>
      </div>
    </div>
  );
}

type LoanScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: LoanRow | null;
};

export function LoanScheduleDialog({
  open,
  onOpenChange,
  loan,
}: LoanScheduleDialogProps) {
  const isMobile = useIsMobile();

  if (!loan) return null;

  const body = (
    <ScheduleContent loan={loan} onDone={() => onOpenChange(false)} />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("loans.scheduleTitle")}</DrawerTitle>
            <DrawerDescription>{loan.lender}</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[75vh] overflow-y-auto px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("loans.scheduleTitle")}</DialogTitle>
          <DialogDescription>
            {loan.lender} ·{" "}
            {loan.payment_type === "annuity"
              ? t("loans.annuity")
              : t("loans.equalPrincipal")}
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
