import { describe, expect, it } from "vitest";

import {
  aggregateByYear,
  calculateAnnuityPayment,
  calculateLoan,
  buildLoanSchedule,
  buildSchedule,
  summarize,
  type LoanInput,
  type LoanScheduleRow,
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

describe("buildSchedule", () => {
  it("matches buildLoanSchedule for both payment types", () => {
    expect(buildSchedule(annuityLoan)).toEqual(buildLoanSchedule(annuityLoan));

    const equalPrincipal: LoanInput = {
      ...annuityLoan,
      paymentType: "equal_principal",
    };
    expect(buildSchedule(equalPrincipal)).toEqual(
      buildLoanSchedule(equalPrincipal),
    );
  });

  it("keeps the annuity payment constant", () => {
    const schedule = buildSchedule(annuityLoan);
    const regular = schedule.slice(0, -1);

    expect(new Set(regular.map((row) => row.payment)).size).toBe(1);
  });

  it("makes equal-principal payments strictly decrease", () => {
    const schedule = buildSchedule({
      ...annuityLoan,
      paymentType: "equal_principal",
    });

    for (let index = 1; index < schedule.length; index += 1) {
      expect(schedule[index].payment).toBeLessThan(schedule[index - 1].payment);
    }
  });

  it("puts the rounding remainder on the last payment so the balance ends at 0", () => {
    const schedule = buildSchedule({
      principal: 100_000_001,
      annualRate: 13.7,
      termMonths: 37,
      startDate: "2026-01-31",
      paymentType: "annuity",
    });

    expect(schedule[schedule.length - 1].balance).toBe(0);
  });
});

describe("summarize", () => {
  it("reports totals that add up to the principal", () => {
    const schedule = buildSchedule(annuityLoan);
    const stats = summarize(schedule);

    expect(stats.totalPrincipal).toBeCloseTo(1_000_000, 2);
    expect(stats.totalPayment).toBeCloseTo(
      stats.totalPrincipal + stats.totalInterest,
      2,
    );
    expect(stats.paymentCount).toBe(12);
    expect(stats.payoffDate).toBe("2027-01-15");
    expect(stats.principalShare).toBeGreaterThan(0);
    expect(stats.principalShare).toBeLessThan(100);
  });

  it("returns zeroed stats for an empty schedule", () => {
    expect(summarize([])).toEqual({
      payment: 0,
      firstPayment: 0,
      lastPayment: 0,
      totalPrincipal: 0,
      totalPayment: 0,
      totalInterest: 0,
      paymentCount: 0,
      payoffDate: "",
      principalShare: 0,
    });
  });
});

describe("aggregateByYear", () => {
  const rows: LoanScheduleRow[] = buildSchedule({
    principal: 3_600_000,
    annualRate: 12,
    termMonths: 30,
    startDate: "2026-05-10",
    paymentType: "annuity",
  });

  it("groups by calendar year and sums payments", () => {
    const years = aggregateByYear(rows);
    const total = years.reduce((sum, year) => sum + year.payment, 0);

    expect(years.map((year) => year.year)).toEqual([2026, 2027, 2028]);
    expect(years.reduce((sum, year) => sum + year.months.length, 0)).toBe(30);
    expect(total).toBeCloseTo(
      rows.reduce((sum, row) => sum + row.payment, 0),
      2,
    );
  });

  it("keeps principal, interest and balance consistent", () => {
    const years = aggregateByYear(rows);

    expect(years.reduce((sum, year) => sum + year.principal, 0)).toBeCloseTo(
      rows.reduce((sum, row) => sum + row.principal, 0),
      2,
    );
    expect(years.reduce((sum, year) => sum + year.interest, 0)).toBeCloseTo(
      rows.reduce((sum, row) => sum + row.interest, 0),
      2,
    );
    expect(years[years.length - 1].balance).toBe(0);
    expect(years[0].balance).toBe(years[0].months.at(-1)?.balance);
  });

  it("averages the monthly payment within each year", () => {
    const [first] = aggregateByYear(rows);

    expect(first.averagePayment).toBeCloseTo(
      first.payment / first.months.length,
      2,
    );
  });
});
