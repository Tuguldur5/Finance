import { describe, expect, it } from "vitest";

import {
  calculateMonthlyRate,
  getGoalProgress,
  projectGoalCompletion,
} from "./goal";

describe("getGoalProgress", () => {
  it("computes percentage and remaining amount", () => {
    const progress = getGoalProgress(1_000_000, 250_000);

    expect(progress.percent).toBe(25);
    expect(progress.remaining).toBe(750_000);
    expect(progress.isComplete).toBe(false);
  });

  it("caps at 100% and marks the goal complete", () => {
    const progress = getGoalProgress(1_000_000, 1_200_000);

    expect(progress.percent).toBe(100);
    expect(progress.remaining).toBe(0);
    expect(progress.isComplete).toBe(true);
  });
});

describe("calculateMonthlyRate", () => {
  const contributions = [
    { amount: 100_000, contributedAt: "2026-04-01" },
    { amount: 200_000, contributedAt: "2026-05-01" },
    { amount: 300_000, contributedAt: "2026-06-01" },
  ];

  it("averages over the months between the first contribution and as-of", () => {
    // Apr, May, Jun -> 3 months.
    expect(calculateMonthlyRate(contributions, "2026-06-01")).toBe(200_000);
  });

  it("returns zero without contributions in the window", () => {
    expect(calculateMonthlyRate([], "2026-06-01")).toBe(0);
    expect(
      calculateMonthlyRate(
        [{ amount: 100_000, contributedAt: "2024-01-01" }],
        "2026-06-01",
      ),
    ).toBe(0);
  });
});

describe("projectGoalCompletion", () => {
  it("projects the completion month from the saving rate", () => {
    const projection = projectGoalCompletion(
      950_000,
      150_000,
      [
        { amount: 100_000, contributedAt: "2026-04-01" },
        { amount: 200_000, contributedAt: "2026-05-01" },
        { amount: 300_000, contributedAt: "2026-06-01" },
      ],
      "2026-06-01",
    );

    expect(projection.monthlyRate).toBe(200_000);
    expect(projection.monthsRemaining).toBe(4);
    expect(projection.projectedDate).toBe("2026-10-01");
  });

  it("returns no projection without savings", () => {
    const projection = projectGoalCompletion(500_000, 0, [], "2026-06-01");

    expect(projection.monthsRemaining).toBeNull();
    expect(projection.projectedDate).toBeNull();
  });

  it("projects today for a completed goal", () => {
    const projection = projectGoalCompletion(
      500_000,
      600_000,
      [],
      "2026-06-01",
    );

    expect(projection.monthsRemaining).toBe(0);
    expect(projection.projectedDate).toBe("2026-06-01");
  });
});
