import { roundMoney, toNumber } from "@/lib/finance/format";

/**
 * Manual-rate currency conversion. Rates are supplied by the user (no
 * external provider), so this stays a pure multiplication.
 */

export type CurrencyResult = {
  amount: number;
  rate: number;
  converted: number;
  inverseRate: number;
};

export function convertCurrency(input: {
  amount: number | string;
  rate: number | string;
}): CurrencyResult {
  const amount = toNumber(input.amount);
  const rate = Math.max(0, toNumber(input.rate));

  return {
    amount: roundMoney(amount),
    rate,
    converted: roundMoney(amount * rate),
    inverseRate: rate > 0 ? roundMoney(1 / rate, 6) : 0,
  };
}
