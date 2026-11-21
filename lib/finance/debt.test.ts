import { describe, expect, it } from "vitest";

import { getDebtProgress } from "./debt";

describe("getDebtProgress", () => {
  it("computes remaining balance and paid percentage", () => {
    const progress = getDebtProgress(
      {
        principal: 1_000_000,
        paid: 250_000,
        dueDate: "2026-12-01",
        status: "active",
      },
      "2026-11-19",
    );

    expect(progress.remaining).toBe(750_000);
    expect(progress.percentPaid).toBe(25);
    expect(progress.isOverdue).toBe(false);
    expect(progress.daysUntilDue).toBe(12);
  });

  it("flags overdue debts", () => {
    const progress = getDebtProgress(
      {
        principal: 500_000,
        paid: 0,
        dueDate: "2026-11-10",
        status: "active",
      },
      "2026-11-19",
    );

    expect(progress.isOverdue).toBe(true);
    expect(progress.daysUntilDue).toBe(-9);
    expect(progress.isDueSoon).toBe(false);
  });

  it("flags debts due within a week", () => {
    const progress = getDebtProgress(
      {
        principal: 500_000,
        paid: 0,
        dueDate: "2026-11-24",
        status: "active",
      },
      "2026-11-19",
    );

    expect(progress.isDueSoon).toBe(true);
    expect(progress.isOverdue).toBe(false);
  });

  it("does not flag a settled debt as overdue", () => {
    const progress = getDebtProgress(
      {
        principal: 500_000,
        paid: 500_000,
        dueDate: "2026-01-01",
        status: "paid",
      },
      "2026-11-19",
    );

    expect(progress.remaining).toBe(0);
    expect(progress.isOverdue).toBe(false);
    expect(progress.isDueSoon).toBe(false);
  });
});
