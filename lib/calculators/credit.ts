import { roundMoney, toNumber } from "@/lib/finance/format";
import {
  buildLoanSchedule,
  type LoanPaymentType,
  type LoanScheduleRow,
} from "@/lib/finance/loan";

/** Loan / mortgage calculations for the public calculators. */

export type CreditInput = {
  principal: number | string;
  annualRate: number | string;
  termMonths: number;
  paymentType?: LoanPaymentType;
  startDate: string;
};

export type CreditYear = {
  year: number;
  balance: number;
  principal: number;
  interest: number;
};

export type CreditResult = {
  loanAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: LoanScheduleRow[];
  yearly: CreditYear[];
};

const EMPTY_CREDIT: CreditResult = {
  loanAmount: 0,
  monthlyPayment: 0,
  totalPayment: 0,
  totalInterest: 0,
  schedule: [],
  yearly: [],
};

export function calcCredit(input: CreditInput): CreditResult {
  const principal = Math.max(0, toNumber(input.principal));
  const termMonths = Math.floor(Math.max(0, input.termMonths));
  const annualRate = Math.max(0, toNumber(input.annualRate));

  if (principal <= 0 || termMonths <= 0) return { ...EMPTY_CREDIT };

  const schedule = buildLoanSchedule({
    principal,
    annualRate,
    termMonths,
    paymentType: input.paymentType ?? "annuity",
    startDate: input.startDate,
  });

  const totalPayment = roundMoney(
    schedule.reduce((sum, row) => sum + row.payment, 0),
  );
  const totalInterest = roundMoney(
    schedule.reduce((sum, row) => sum + row.interest, 0),
  );

  const yearlyMap = new Map<number, CreditYear>();
  for (const row of schedule) {
    const year = Math.ceil(row.month / 12);
    const entry = yearlyMap.get(year) ?? {
      year,
      balance: 0,
      principal: 0,
      interest: 0,
    };
    entry.balance = row.balance;
    entry.principal = roundMoney(entry.principal + row.principal);
    entry.interest = roundMoney(entry.interest + row.interest);
    yearlyMap.set(year, entry);
  }

  return {
    loanAmount: roundMoney(principal),
    monthlyPayment: schedule[0]?.payment ?? 0,
    totalPayment,
    totalInterest,
    schedule,
    yearly: [...yearlyMap.values()],
  };
}

export type MortgageInput = {
  propertyPrice: number | string;
  downPayment: number | string;
  annualRate: number | string;
  termYears: number;
  startDate: string;
};

export type MortgageResult = CreditResult & {
  propertyPrice: number;
  downPayment: number;
  downPaymentPercent: number;
};

export function calcMortgage(input: MortgageInput): MortgageResult {
  const propertyPrice = Math.max(0, toNumber(input.propertyPrice));
  const downPayment = Math.min(
    propertyPrice,
    Math.max(0, toNumber(input.downPayment)),
  );
  const loanAmount = roundMoney(Math.max(propertyPrice - downPayment, 0));
  const termMonths = Math.round(Math.max(0, input.termYears) * 12);

  const credit = calcCredit({
    principal: loanAmount,
    annualRate: input.annualRate,
    termMonths,
    paymentType: "annuity",
    startDate: input.startDate,
  });

  return {
    ...credit,
    propertyPrice: roundMoney(propertyPrice),
    downPayment: roundMoney(downPayment),
    downPaymentPercent:
      propertyPrice > 0
        ? Math.round((downPayment / propertyPrice) * 1000) / 10
        : 0,
  };
}
