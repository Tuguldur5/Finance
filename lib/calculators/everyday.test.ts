import { describe, expect, it } from "vitest";

import { calcBudgetSplit } from "./budget";
import { convertCurrency } from "./currency";
import { calcVat } from "./vat";

describe("calcVat", () => {
  it("adds VAT to a net amount", () => {
    expect(calcVat({ amount: 1_000_000, rate: 10, mode: "add" })).toEqual({
      net: 1_000_000,
      vat: 100_000,
      gross: 1_100_000,
      rate: 10,
    });
  });

  it("extracts VAT from a gross amount", () => {
    expect(calcVat({ amount: 1_100_000, rate: 10, mode: "remove" })).toEqual({
      net: 1_000_000,
      vat: 100_000,
      gross: 1_100_000,
      rate: 10,
    });
  });

  it("handles a zero rate", () => {
    expect(calcVat({ amount: 50_000, rate: 0, mode: "add" })).toMatchObject({
      vat: 0,
      gross: 50_000,
    });
  });
});

describe("convertCurrency", () => {
  it("multiplies by the manual rate", () => {
    expect(convertCurrency({ amount: 100, rate: 3400 })).toMatchObject({
      converted: 340_000,
      rate: 3400,
    });
  });

  it("returns a zero inverse for a zero rate", () => {
    expect(convertCurrency({ amount: 100, rate: 0 })).toMatchObject({
      converted: 0,
      inverseRate: 0,
    });
  });

  it("rounds to two decimals", () => {
    expect(convertCurrency({ amount: 10, rate: 1.23456 }).converted).toBe(12.35);
  });
});

describe("calcBudgetSplit", () => {
  it("splits 50/30/20 and keeps the total exact", () => {
    const result = calcBudgetSplit(3_000_000);

    expect(result.needs).toBe(1_500_000);
    expect(result.wants).toBe(900_000);
    expect(result.savings).toBe(600_000);
    expect(result.needs + result.wants + result.savings).toBe(3_000_000);
  });

  it("treats a negative income as zero", () => {
    expect(calcBudgetSplit(-100)).toMatchObject({
      income: 0,
      needs: 0,
      wants: 0,
      savings: 0,
    });
  });
});
