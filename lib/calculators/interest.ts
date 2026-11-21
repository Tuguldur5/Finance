import { roundMoney, toNumber } from "@/lib/finance/format";

/** Simple, compound, savings and investment growth math. */

export type SimpleInterestResult = {
  principal: number;
  interest: number;
  total: number;
  yearly: { year: number; balance: number }[];
};

export function calcSimpleInterest(input: {
  principal: number | string;
  annualRate: number | string;
  years: number;
}): SimpleInterestResult {
  const principal = Math.max(0, toNumber(input.principal));
  const annualRate = Math.max(0, toNumber(input.annualRate));
  const years = Math.max(0, input.years);

  const interest = roundMoney(principal * (annualRate / 100) * years);
  const yearly: { year: number; balance: number }[] = [];

  for (let year = 1; year <= Math.floor(years); year += 1) {
    yearly.push({
      year,
      balance: roundMoney(principal + principal * (annualRate / 100) * year),
    });
  }

  return {
    principal: roundMoney(principal),
    interest,
    total: roundMoney(principal + interest),
    yearly,
  };
}

export type GrowthPoint = {
  year: number;
  balance: number;
  contributed: number;
};

export type GrowthResult = {
  finalAmount: number;
  contributions: number;
  interest: number;
  yearly: GrowthPoint[];
  months: number;
};

/**
 * Recurring monthly saving with monthly compounding. Contributions are added
 * at the end of each month, after interest for that month.
 */
export function projectMonthlyGrowth(input: {
  initial: number | string;
  monthly: number | string;
  annualRate: number | string;
  months: number;
}): GrowthResult {
  const initialAmount = Math.max(0, toNumber(input.initial));
  const monthly = Math.max(0, toNumber(input.monthly));
  const months = Math.max(0, Math.floor(input.months));
  const monthlyRate = Math.max(0, toNumber(input.annualRate)) / 100 / 12;

  let balance = roundMoney(initialAmount);
  let contributed = roundMoney(initialAmount);
  const yearly: GrowthPoint[] = [];

  for (let month = 1; month <= months; month += 1) {
    balance = roundMoney(balance * (1 + monthlyRate) + monthly);
    contributed = roundMoney(contributed + monthly);

    if (month % 12 === 0 || month === months) {
      yearly.push({
        year: Math.ceil(month / 12),
        balance,
        contributed,
      });
    }
  }

  return {
    finalAmount: balance,
    contributions: contributed,
    interest: roundMoney(balance - contributed),
    yearly,
    months,
  };
}

export type CompoundInterestResult = {
  principal: number;
  finalAmount: number;
  interest: number;
  effectiveRate: number;
  yearly: { year: number; balance: number }[];
};

/** Compound interest without recurring contributions. */
export function calcCompoundInterest(input: {
  principal: number | string;
  annualRate: number | string;
  years: number;
  compoundsPerYear: number;
}): CompoundInterestResult {
  const principal = Math.max(0, toNumber(input.principal));
  const annualRate = Math.max(0, toNumber(input.annualRate));
  const years = Math.max(0, input.years);
  const periods = Math.max(1, Math.floor(input.compoundsPerYear));

  const periodicRate = annualRate / 100 / periods;
  const totalPeriods = Math.floor(years * periods);
  const yearly: { year: number; balance: number }[] = [];

  for (let period = 1; period <= totalPeriods; period += 1) {
    if (period % periods === 0) {
      const balance = roundMoney(
        principal * Math.pow(1 + periodicRate, period),
      );
      yearly.push({ year: period / periods, balance });
    }
  }

  const finalAmount = roundMoney(
    principal * Math.pow(1 + periodicRate, years * periods),
  );
  const effectiveRate =
    principal > 0
      ? Math.round((finalAmount / principal - 1) * 10000) / 100
      : 0;

  return {
    principal: roundMoney(principal),
    finalAmount,
    interest: roundMoney(finalAmount - principal),
    effectiveRate,
    yearly,
  };
}

export type SavingsInput = {
  initial: number | string;
  monthly: number | string;
  annualRate: number | string;
  months: number;
};

export function calcSavings(input: SavingsInput): GrowthResult {
  return projectMonthlyGrowth(input);
}

export type InvestmentInput = {
  initial: number | string;
  monthly: number | string;
  annualRate: number | string;
  years: number;
};

export type InvestmentResult = GrowthResult & {
  roiPercent: number;
};

export function calcInvestmentReturn(
  input: InvestmentInput,
): InvestmentResult {
  const growth = projectMonthlyGrowth({
    initial: input.initial,
    monthly: input.monthly,
    annualRate: input.annualRate,
    months: Math.max(0, input.years) * 12,
  });

  return {
    ...growth,
    roiPercent:
      growth.contributions > 0
        ? Math.round((growth.interest / growth.contributions) * 1000) / 10
        : 0,
  };
}
