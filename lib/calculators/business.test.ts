import { describe, expect, it } from "vitest";

import {
  calcBreakEven,
  calcDiscount,
  calcMargin,
  calcProfit,
} from "./business";

describe("calcProfit", () => {
  it("computes profit and margin", () => {
    expect(calcProfit({ revenue: 10_000_000, cost: 6_000_000 })).toEqual({
      revenue: 10_000_000,
      cost: 6_000_000,
      profit: 4_000_000,
      marginPercent: 40,
      isLoss: false,
    });
  });

  it("flags a loss", () => {
    expect(calcProfit({ revenue: 1_000, cost: 1_500 })).toMatchObject({
      profit: -500,
      marginPercent: -50,
      isLoss: true,
    });
  });
});

describe("calcMargin", () => {
  it("computes margin, markup and cost share", () => {
    expect(calcMargin({ revenue: 10_000_000, cost: 6_000_000 })).toEqual({
      revenue: 10_000_000,
      cost: 6_000_000,
      profit: 4_000_000,
      marginPercent: 40,
      markupPercent: 66.7,
      costPercent: 60,
    });
  });

  it("returns zero percentages for zero revenue", () => {
    expect(calcMargin({ revenue: 0, cost: 0 })).toMatchObject({
      marginPercent: 0,
      markupPercent: 0,
      costPercent: 0,
    });
  });
});

describe("calcBreakEven", () => {
  it("rounds break-even units up", () => {
    expect(
      calcBreakEven({
        fixedCosts: 5_000_000,
        pricePerUnit: 100_000,
        variableCostPerUnit: 60_000,
      }),
    ).toEqual({
      fixedCosts: 5_000_000,
      pricePerUnit: 100_000,
      variableCostPerUnit: 60_000,
      contributionPerUnit: 40_000,
      breakEvenUnits: 125,
      breakEvenRevenue: 12_500_000,
      isFeasible: true,
    });
  });

  it("is infeasible when the price is below variable cost", () => {
    expect(
      calcBreakEven({
        fixedCosts: 1_000_000,
        pricePerUnit: 50_000,
        variableCostPerUnit: 60_000,
      }),
    ).toMatchObject({
      contributionPerUnit: -10_000,
      breakEvenUnits: 0,
      isFeasible: false,
    });
  });

  it("rounds partial units up", () => {
    expect(
      calcBreakEven({
        fixedCosts: 100,
        pricePerUnit: 30,
        variableCostPerUnit: 10,
      }).breakEvenUnits,
    ).toBe(5);
  });
});

describe("calcDiscount", () => {
  it("computes the discount and final price", () => {
    expect(calcDiscount({ price: 500_000, discountPercent: 20 })).toEqual({
      price: 500_000,
      discountPercent: 20,
      discountAmount: 100_000,
      finalPrice: 400_000,
    });
  });

  it("clamps the discount to 0–100", () => {
    expect(
      calcDiscount({ price: 500_000, discountPercent: 150 }).finalPrice,
    ).toBe(0);
    expect(
      calcDiscount({ price: 500_000, discountPercent: -10 }).finalPrice,
    ).toBe(500_000);
  });
});
