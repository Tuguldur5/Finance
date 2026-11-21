import { differenceInCalendarDays, parseISO } from "date-fns";

import { roundMoney, toNumber } from "./format";

export type DebtStatus = "active" | "paid" | "overdue";

export type DebtProgress = {
  principal: number;
  paid: number;
  remaining: number;
  /** 0–100, rounded to one decimal. */
  percentPaid: number;
  isOverdue: boolean;
  /** Negative when the due date has passed. */
  daysUntilDue: number | null;
  isDueSoon: boolean;
};

/** Remaining balance and due-date state for a debt. */
export function getDebtProgress(
  debt: {
    principal: number | string;
    paid: number | string;
    dueDate?: string | null;
    status?: DebtStatus;
  },
  today: string,
): DebtProgress {
  const principal = roundMoney(toNumber(debt.principal));
  const paid = roundMoney(toNumber(debt.paid));
  const remaining = Math.max(roundMoney(principal - paid), 0);
  const percentPaid =
    principal > 0
      ? Math.min(100, Math.round((paid / principal) * 1000) / 10)
      : 0;

  const todayDate = parseISO(today);
  const dueDate = debt.dueDate ? parseISO(debt.dueDate) : null;
  const validDue = dueDate && !Number.isNaN(dueDate.getTime());

  const daysUntilDue =
    validDue && !Number.isNaN(todayDate.getTime())
      ? differenceInCalendarDays(dueDate, todayDate)
      : null;

  const settled = debt.status === "paid" || remaining <= 0;
  const isOverdue = !settled && daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon =
    !settled && daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

  return {
    principal,
    paid,
    remaining,
    percentPaid,
    isOverdue,
    daysUntilDue,
    isDueSoon,
  };
}
