import { describe, expect, it } from "vitest";

import { calcCredit, calcMortgage } from "./credit";

const START = "2026-01-01";

describe("calcCredit", () => {
  it("computes an annuity payment and a zero-ending schedule", () => {
    const result = calcCredit({
      principal: 10_000_000,
      annualRate: 12,
      termMonths: 12,
      startDate: START,
    });

    expect(result.monthlyPayment).toBeCloseTo(888_488, 0);
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule.at(-1)?.balance).toBe(0);
    expect(result.totalPayment).toBeGreaterThan(10_000_000);
    expect(result.totalInterest).toBeCloseTo(
      result.totalPayment - 10_000_000,
      0,
    );
  });

  it("handles a zero-rate loan", () => {
    const result = calcCredit({
      principal: 1_200_000,
      annualRate: 0,
      termMonths: 12,
      startDate: START,
    });

    expect(result.monthlyPayment).toBe(100_000);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPayment).toBe(1_200_000);
  });

  it("returns empty results for an empty term", () => {
    const result = calcCredit({
      principal: 1_000_000,
      annualRate: 10,
      termMonths: 0,
      startDate: START,
    });

    expect(result.loanAmount).toBe(0);
    expect(result.monthlyPayment).toBe(0);
    expect(result.schedule).toEqual([]);
  });

  it("aggregates the schedule into yearly buckets", () => {
    const result = calcCredit({
      principal: 1_200_000,
      annualRate: 12,
      termMonths: 24,
      startDate: START,
    });

    expect(result.yearly).toHaveLength(2);
    expect(result.yearly[0].year).toBe(1);
    expect(result.yearly[1].year).toBe(2);
    expect(result.yearly.at(-1)?.balance).toBe(0);
  });
});

describe("calcMortgage", () => {
  it("subtracts the down payment and reports its share", () => {
    const result = calcMortgage({
      propertyPrice: 200_000_000,
      downPayment: 40_000_000,
      annualRate: 8,
      termYears: 20,
      startDate: START,
    });

    expect(result.loanAmount).toBe(160_000_000);
    expect(result.downPaymentPercent).toBe(20);
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it("caps the down payment at the property price", () => {
    const result = calcMortgage({
      propertyPrice: 100_000_000,
      downPayment: 150_000_000,
      annualRate: 8,
      termYears: 10,
      startDate: START,
    });

    expect(result.loanAmount).toBe(0);
    expect(result.downPayment).toBe(100_000_000);
    expect(result.monthlyPayment).toBe(0);
  });
});
