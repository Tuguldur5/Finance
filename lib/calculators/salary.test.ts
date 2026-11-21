import { describe, expect, it } from "vitest";

import { calcSalary, salaryFromGross, salaryFromNet } from "./salary";

describe("salaryFromGross", () => {
  it("deducts social insurance and the flat income tax", () => {
    const result = salaryFromGross(1_000_000);

    expect(result.socialInsurance).toBe(115_000);
    expect(result.taxableIncome).toBe(865_000);
    expect(result.incomeTax).toBe(86_500);
    expect(result.net).toBe(798_500);
    expect(result.totalDeductions).toBe(201_500);
    expect(result.annualNet).toBe(9_582_000);
  });

  it("does not tax below the credit threshold", () => {
    const result = salaryFromGross(20_000);

    expect(result.socialInsurance).toBe(2_300);
    expect(result.taxableIncome).toBe(0);
    expect(result.incomeTax).toBe(0);
    expect(result.net).toBe(17_700);
  });

  it("returns zeroes for no income", () => {
    expect(salaryFromGross(0)).toMatchObject({
      gross: 0,
      net: 0,
      incomeTax: 0,
      socialInsurance: 0,
    });
  });
});

describe("salaryFromNet", () => {
  it("inverts the gross calculation", () => {
    const result = salaryFromNet(798_500);

    expect(result.gross).toBeCloseTo(1_000_000, 0);
    expect(result.net).toBeCloseTo(798_500, 0);
  });

  it("returns zero for zero net", () => {
    expect(salaryFromNet(0).gross).toBe(0);
  });
});

describe("calcSalary", () => {
  it("reads the mode", () => {
    expect(calcSalary({ amount: 1_000_000, mode: "gross" }).net).toBe(798_500);
    expect(calcSalary({ amount: 798_500, mode: "net" }).gross).toBeCloseTo(
      1_000_000,
      0,
    );
  });
});
