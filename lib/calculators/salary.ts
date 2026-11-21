import { PAYROLL_CONFIG } from "@/lib/config";
import { roundMoney, toNumber } from "@/lib/finance/format";

/**
 * Mongolian salary net/gross conversion.
 *
 * Employee social insurance is deducted first, then the monthly tax credit
 * is applied to the remaining base, and the flat personal income tax is
 * charged on the result. All rates come from `PAYROLL_CONFIG`.
 */

export type SalaryBreakdown = {
  gross: number;
  net: number;
  socialInsurance: number;
  taxableIncome: number;
  incomeTax: number;
  totalDeductions: number;
  annualNet: number;
  annualGross: number;
};

export type SalaryMode = "gross" | "net";

export function salaryFromGross(amount: number | string): SalaryBreakdown {
  const gross = Math.max(0, roundMoney(toNumber(amount)));
  const socialInsurance = roundMoney(
    gross * PAYROLL_CONFIG.socialInsuranceRate,
  );
  const taxableIncome = roundMoney(
    Math.max(
      0,
      gross -
        socialInsurance -
        (gross > 0 ? PAYROLL_CONFIG.monthlyTaxCredit : 0),
    ),
  );
  const incomeTax = roundMoney(
    taxableIncome * PAYROLL_CONFIG.personalIncomeTaxRate,
  );
  const net = roundMoney(gross - socialInsurance - incomeTax);

  return {
    gross,
    net,
    socialInsurance,
    taxableIncome,
    incomeTax,
    totalDeductions: roundMoney(socialInsurance + incomeTax),
    annualNet: roundMoney(net * 12),
    annualGross: roundMoney(gross * 12),
  };
}

/** Inverts `salaryFromGross` with a fixed-iteration binary search. */
export function salaryFromNet(netAmount: number | string): SalaryBreakdown {
  const targetNet = roundMoney(Math.max(0, toNumber(netAmount)));

  if (targetNet <= 0) return salaryFromGross(0);

  let low = targetNet;
  let high = targetNet * 3;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const mid = (low + high) / 2;
    if (salaryFromGross(mid).net < targetNet) low = mid;
    else high = mid;
  }

  return salaryFromGross(roundMoney((low + high) / 2));
}

export function calcSalary(input: {
  amount: number | string;
  mode: SalaryMode;
}): SalaryBreakdown {
  return input.mode === "net"
    ? salaryFromNet(input.amount)
    : salaryFromGross(input.amount);
}
