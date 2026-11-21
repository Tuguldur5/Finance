import { roundMoney, toNumber } from "@/lib/finance/format";

export type VatMode = "add" | "remove";

export type VatResult = {
  net: number;
  vat: number;
  gross: number;
  rate: number;
};

/**
 * VAT calculator.
 * - add: `amount` is net, VAT is added on top.
 * - remove: `amount` is gross, net and VAT are extracted from it.
 */
export function calcVat(input: {
  amount: number | string;
  rate: number | string;
  mode: VatMode;
}): VatResult {
  const amount = Math.max(0, toNumber(input.amount));
  const rate = Math.max(0, toNumber(input.rate));

  if (input.mode === "remove") {
    const net = roundMoney(amount / (1 + rate / 100));
    return {
      net,
      vat: roundMoney(amount - net),
      gross: roundMoney(amount),
      rate,
    };
  }

  const vat = roundMoney(amount * (rate / 100));
  return {
    net: roundMoney(amount),
    vat,
    gross: roundMoney(amount + vat),
    rate,
  };
}
