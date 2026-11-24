"use client";

import { LoanResult } from "@/components/finance/loan-result";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { calculateLoan } from "@/lib/finance/loan";
import { toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import type { LoanRow } from "@/types/entities";

function ScheduleContent({ loan }: { loan: LoanRow }) {
  const summary = calculateLoan({
    principal: toNumber(loan.principal),
    annualRate: toNumber(loan.annual_rate),
    termMonths: loan.term_months,
    startDate: loan.start_date,
    paymentType: loan.payment_type,
  });

  return (
    <LoanResult
      schedule={summary.schedule}
      paymentType={loan.payment_type}
    />
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

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("loans.scheduleTitle")}</DrawerTitle>
            <DrawerDescription>{loan.lender}</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[75vh] overflow-y-auto px-4 pb-6">
            <ScheduleContent loan={loan} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("loans.scheduleTitle")}</DialogTitle>
          <DialogDescription>
            {loan.lender} ·{" "}
            {loan.payment_type === "annuity"
              ? t("loans.annuity")
              : t("loans.equalPrincipal")}
          </DialogDescription>
        </DialogHeader>
        <ScheduleContent loan={loan} />
      </DialogContent>
    </Dialog>
  );
}
