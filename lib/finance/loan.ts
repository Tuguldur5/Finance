import { addMonths, differenceInCalendarMonths, format, parseISO } from "date-fns";

import { roundMoney, toNumber } from "./format";

/**
 * Loan amortization.
 *
 * annuity:
 *   A = P·r / (1 − (1+r)^−n)          (r = annualRate / 12 / 100)
 * equal_principal:
 *   principal_k = P / n
 *   interest_k  = balance_{k−1} · r
 *
 * All money is rounded to 2 decimals after every step and the last payment
 * is adjusted so the remaining balance lands exactly on 0.
 */

export type LoanPaymentType = "annuity" | "equal_principal";

export type LoanInput = {
  principal: number;
  annualRate: number;
  termMonths: number;
  startDate: string;
  paymentType: LoanPaymentType;
};

export type LoanScheduleRow = {
  month: number;
  dueDate: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type LoanSummary = {
  /** Regular payment (first month for equal-principal loans). */
  payment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: LoanScheduleRow[];
  payoffDate: string;
  nextPayment: LoanScheduleRow | null;
  outstandingBalance: number;
  elapsedMonths: number;
};

export function calculateAnnuityPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0;

  const rate = annualRate / 100 / 12;

  if (rate === 0) {
    return roundMoney(principal / termMonths);
  }

  const factor = Math.pow(1 + rate, -termMonths);
  return roundMoney((principal * rate) / (1 - factor));
}

export function buildLoanSchedule(input: LoanInput): LoanScheduleRow[] {
  const { principal, annualRate, termMonths, startDate, paymentType } = input;

  if (principal <= 0 || termMonths <= 0) return [];

  const rate = annualRate / 100 / 12;
  const annuityPayment = calculateAnnuityPayment(
    principal,
    annualRate,
    termMonths,
  );
  const equalPrincipalPart = roundMoney(principal / termMonths);

  const rows: LoanScheduleRow[] = [];
  let balance = principal;

  for (let month = 1; month <= termMonths; month += 1) {
    const interest = roundMoney(balance * rate);

    let principalPart: number;
    let payment: number;

    if (paymentType === "equal_principal") {
      principalPart =
        month === termMonths ? balance : Math.min(equalPrincipalPart, balance);
      payment = roundMoney(principalPart + interest);
    } else {
      payment =
        month === termMonths ? roundMoney(balance + interest) : annuityPayment;
      principalPart = roundMoney(payment - interest);
    }

    if (principalPart > balance) principalPart = balance;
    balance = roundMoney(balance - principalPart);

    rows.push({
      month,
      dueDate: format(addMonths(parseISO(startDate), month), "yyyy-MM-dd"),
      payment,
      principal: principalPart,
      interest,
      balance,
    });
  }

  return rows;
}

/** Completed payments as of `asOf` (calendar months). */
function elapsedMonthsFrom(startDate: string, asOf: string): number {
  const start = parseISO(startDate);
  const end = parseISO(asOf);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  return Math.max(0, differenceInCalendarMonths(end, start));
}

export function calculateLoan(
  input: LoanInput,
  asOf: string = format(new Date(), "yyyy-MM-dd"),
): LoanSummary {
  const schedule = buildLoanSchedule(input);
  const totalPayment = roundMoney(
    schedule.reduce((sum, row) => sum + row.payment, 0),
  );
  const totalInterest = roundMoney(
    schedule.reduce((sum, row) => sum + row.interest, 0),
  );

  const elapsed = Math.min(
    elapsedMonthsFrom(input.startDate, asOf),
    input.termMonths,
  );
  const outstandingBalance =
    elapsed <= 0
      ? roundMoney(toNumber(input.principal))
      : elapsed >= input.termMonths
        ? 0
        : (schedule[elapsed - 1]?.balance ?? 0);

  const nextPayment = schedule.find((row) => row.dueDate >= asOf) ?? null;

  return {
    payment: schedule[0]?.payment ?? 0,
    totalPayment,
    totalInterest,
    schedule,
    payoffDate: schedule[schedule.length - 1]?.dueDate ?? input.startDate,
    nextPayment,
    outstandingBalance,
    elapsedMonths: elapsed,
  };
}
