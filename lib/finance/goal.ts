import { addMonths, differenceInCalendarMonths, format, parseISO } from "date-fns";

import { roundMoney, toNumber } from "./format";

export type GoalProgress = {
  target: number;
  current: number;
  remaining: number;
  /** 0–100, rounded to one decimal. */
  percent: number;
  isComplete: boolean;
};

export function getGoalProgress(
  targetAmount: number | string,
  currentAmount: number | string,
): GoalProgress {
  const target = roundMoney(toNumber(targetAmount));
  const current = roundMoney(toNumber(currentAmount));
  const remaining = Math.max(roundMoney(target - current), 0);
  const percent =
    target > 0
      ? Math.min(100, Math.round((current / target) * 1000) / 10)
      : 0;

  return {
    target,
    current,
    remaining,
    percent,
    isComplete: target > 0 && current >= target,
  };
}

export type ContributionInput = {
  amount: number | string;
  contributedAt: string;
};

export type GoalProjection = {
  /** Average saved per month over the observed window. */
  monthlyRate: number;
  remaining: number;
  /** null when no positive saving rate exists. */
  monthsRemaining: number | null;
  /** yyyy-MM-dd, null when it cannot be projected. */
  projectedDate: string | null;
};

/**
 * Average monthly saving rate over the last `lookbackMonths` months
 * (default 6), measured from the first contribution inside that window to
 * `asOf`. Contributions outside the window are ignored.
 */
export function calculateMonthlyRate(
  contributions: ContributionInput[],
  asOf: string,
  lookbackMonths = 6,
): number {
  const end = parseISO(asOf);
  if (Number.isNaN(end.getTime())) return 0;

  const windowStart = addMonths(end, -lookbackMonths);
  const inWindow = contributions.filter((contribution) => {
    const date = parseISO(contribution.contributedAt);
    return !Number.isNaN(date.getTime()) && date >= windowStart && date <= end;
  });

  if (inWindow.length === 0) return 0;

  const earliest = inWindow.reduce((oldest, contribution) =>
    contribution.contributedAt < oldest.contributedAt
      ? contribution
      : oldest,
  );
  const earliestDate = parseISO(earliest.contributedAt);
  const spanMonths = Math.max(
    1,
    differenceInCalendarMonths(end, earliestDate) + 1,
  );

  const total = inWindow.reduce(
    (sum, contribution) => sum + toNumber(contribution.amount),
    0,
  );

  return roundMoney(total / spanMonths);
}

export function projectGoalCompletion(
  targetAmount: number | string,
  currentAmount: number | string,
  contributions: ContributionInput[],
  asOf: string,
): GoalProjection {
  const progress = getGoalProgress(targetAmount, currentAmount);
  const monthlyRate = calculateMonthlyRate(contributions, asOf);

  if (progress.isComplete) {
    return {
      monthlyRate,
      remaining: 0,
      monthsRemaining: 0,
      projectedDate: asOf,
    };
  }

  if (monthlyRate <= 0 || progress.remaining <= 0) {
    return {
      monthlyRate,
      remaining: progress.remaining,
      monthsRemaining: null,
      projectedDate: null,
    };
  }

  const monthsRemaining = Math.ceil(progress.remaining / monthlyRate);

  return {
    monthlyRate,
    remaining: progress.remaining,
    monthsRemaining,
    projectedDate: format(addMonths(parseISO(asOf), monthsRemaining), "yyyy-MM-dd"),
  };
}
