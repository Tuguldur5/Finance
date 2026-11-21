import { describe, expect, it } from "vitest";

import {
  calculateAnnuityPayment,
  calculateLoan,
  buildLoanSchedule,
  type LoanInput,
} from "./loan";

const annuityLoan: LoanInput = {
  principal: 1_000_000,
  annualRate: 12,
  termMonths: 12,
  startDate: "2026-01-15",
  paymentType: "annuity",
};

describe("calculateAnnuityPayment", () => {
  it("returns principal / term when the rate is zero", () => {
    expect(calculateAnnuityPayment(1_200_000, 0, 12)).toBe(100_000);
  });

  it("matches the standard annuity formula", () => {
    expect(calculateAnnuityPayment(1_000_000, 12, 12)).toBe(88_848.79);
  });
});

describe("buildLoanSchedule", () => {
  it("produces one row per month and dates one month apart", () => {
    const schedule = buildLoanSchedule(annuityLoan);

    expect(schedule).toHaveLength(12);
    expect(schedule[0].dueDate).toBe("2026-02-15");
    expect(schedule[11].dueDate).toBe("2027-01-15");
  });

  it("clears the balance exactly on the last payment", () => {
    const schedule = buildLoanSchedule(annuityLoan);

    expect(schedule[schedule.length - 1].balance).toBe(0);
  });

  it("splits an equal-principal payment into principal and interest", () => {
    const schedule = buildLoanSchedule({
      principal: 120_000,
      annualRate: 12,
      termMonths: 12,
      startDate: "2026-01-01",
      paymentType: "equal_principal",
    });

    expect(schedule[0].principal).toBe(10_000);
    expect(schedule[0].interest).toBe(1_200);
    expect(schedule[0].payment).toBe(11_200);
    expect(schedule[11].payment).toBe(10_100);
    expect(schedule[11].balance).toBe(0);
  });
});

describe("calculateLoan", () => {
  it("totals payments and interest for an annuity loan", () => {
    const summary = calculateLoan(annuityLoan, "2026-01-15");

    expect(summary.payment).toBe(88_848.79);
    expect(summary.totalInterest).toBeGreaterThan(66_000);
    expect(summary.totalInterest).toBeLessThan(66_500);
    expect(summary.totalPayment).toBeGreaterThan(1_000_000);
    expect(summary.payoffDate).toBe("2027-01-15");
  });

  it("has zero interest when the rate is zero", () => {
    const summary = calculateLoan(
      { ...annuityLoan, annualRate: 0, principal: 1_200_000 },
      "2026-01-15",
    );

    expect(summary.totalInterest).toBe(0);
    expect(summary.schedule.every((row) => row.payment === 100_000)).toBe(true);
  });

  it("computes total interest for equal principal as r·P·(n+1)/2", () => {
    const summary = calculateLoan(
      {
        principal: 120_000,
        annualRate: 12,
        termMonths: 12,
        startDate: "2026-01-01",
        paymentType: "equal_principal",
      },
      "2026-01-01",
    );

    expect(summary.totalInterest).toBe(7_800);
  });

  it("tracks outstanding balance and the next payment as of a date", () => {
    const summary = calculateLoan(
      { ...annuityLoan, principal: 120_000 },
      "2026-04-01",
    );

    expect(summary.elapsedMonths).toBe(3);
    expect(summary.outstandingBalance).toBe(summary.schedule[2].balance);
    expect(summary.nextPayment?.dueDate).toBe("2026-04-15");
  });

  it("is fully paid after the term", () => {
    const summary = calculateLoan(annuityLoan, "2027-03-01");

    expect(summary.outstandingBalance).toBe(0);
    expect(summary.nextPayment).toBeNull();
  });
});
