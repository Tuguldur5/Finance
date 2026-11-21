import { describe, expect, it } from "vitest";

import {
  calcCompoundInterest,
  calcInvestmentReturn,
  calcSavings,
  calcSimpleInterest,
  projectMonthlyGrowth,
} from "./interest";

describe("calcSimpleInterest", () => {
  it("computes linear interest", () => {
    const result = calcSimpleInterest({
      principal: 1_000_000,
      annualRate: 10,
      years: 2,
    });

    expect(result).toMatchObject({
      principal: 1_000_000,
      interest: 200_000,
      total: 1_200_000,
    });
    expect(result.yearly).toEqual([
      { year: 1, balance: 1_100_000 },
      { year: 2, balance: 1_200_000 },
    ]);
  });

  it("returns zero for negative inputs", () => {
    expect(
      calcSimpleInterest({ principal: -5, annualRate: -1, years: -2 }),
    ).toEqual({ principal: 0, interest: 0, total: 0, yearly: [] });
  });
});

describe("calcCompoundInterest", () => {
  it("compounds annually", () => {
    const result = calcCompoundInterest({
      principal: 1_000_000,
      annualRate: 10,
      years: 2,
      compoundsPerYear: 1,
    });

    expect(result.finalAmount).toBe(1_210_000);
    expect(result.interest).toBe(210_000);
    expect(result.yearly).toHaveLength(2);
  });

  it("compounds monthly to a higher total", () => {
    const result = calcCompoundInterest({
      principal: 1_000_000,
      annualRate: 12,
      years: 1,
      compoundsPerYear: 12,
    });

    expect(result.finalAmount).toBeCloseTo(1_126_825, 0);
    expect(result.effectiveRate).toBeCloseTo(12.68, 1);
  });

  it("keeps the principal when the rate is zero", () => {
    const result = calcCompoundInterest({
      principal: 500_000,
      annualRate: 0,
      years: 5,
      compoundsPerYear: 12,
    });

    expect(result.finalAmount).toBe(500_000);
    expect(result.interest).toBe(0);
  });
});

describe("projectMonthlyGrowth", () => {
  it("adds contributions every month", () => {
    const result = projectMonthlyGrowth({
      initial: 0,
      monthly: 100_000,
      annualRate: 0,
      months: 12,
    });

    expect(result.finalAmount).toBe(1_200_000);
    expect(result.contributions).toBe(1_200_000);
    expect(result.interest).toBe(0);
    expect(result.yearly).toHaveLength(1);
  });

  it("builds a yearly series for partial years", () => {
    const result = projectMonthlyGrowth({
      initial: 0,
      monthly: 50_000,
      annualRate: 10,
      months: 18,
    });

    expect(result.yearly.map((point) => point.year)).toEqual([1, 2]);
    expect(result.yearly.at(-1)?.balance).toBe(result.finalAmount);
  });
});

describe("calcSavings", () => {
  it("earns interest on the growing balance", () => {
    const result = calcSavings({
      initial: 1_000_000,
      monthly: 100_000,
      annualRate: 12,
      months: 12,
    });

    expect(result.finalAmount).toBeGreaterThan(2_200_000);
    expect(result.interest).toBeGreaterThan(0);
  });
});

describe("calcInvestmentReturn", () => {
  it("reports return on contributions", () => {
    const result = calcInvestmentReturn({
      initial: 1_000_000,
      monthly: 0,
      annualRate: 12,
      years: 1,
    });

    expect(result.finalAmount).toBeCloseTo(1_126_825, 0);
    expect(result.roiPercent).toBeCloseTo(12.7, 1);
  });
});
