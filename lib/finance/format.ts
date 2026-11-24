import {
  CURRENCY_DECIMALS,
  CURRENCY_SYMBOLS,
  CURRENCY_SYMBOL_POSITION,
  DEFAULT_CURRENCY,
  NUMBER_LOCALE,
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/config";

/** Anything that may arrive from a numeric column, form input or API. */
export type MoneyInput = number | string | null | undefined;

export type FormatMoneyOptions = {
  /** Prefix positive amounts with "+" (useful for deltas). */
  signed?: boolean;
  /** Override the currency's default decimals. */
  decimals?: number;
};

/**
 * Coerce a numeric-ish value to a finite number.
 * Postgres `numeric` columns come back as strings, so this is the single
 * place where that conversion happens.
 */
export function toNumber(value: MoneyInput): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

/**
 * Round to a fixed number of decimals using EPSILON to avoid the classic
 * `1.005 -> 1.00` float bug. Money is stored as numeric in Postgres; this
 * helper exists only for display/summation in JS.
 */
export function roundMoney(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;

  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Group digits with a comma: 1234567 -> "1,234,567". */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(value);
}

/** 1,234,567 -> "1.2сая" for compact chart axes. */
export function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 1)}тэрбум`;
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}сая`;
  if (abs >= 10_000) return `${formatNumber(value / 1_000, 0)}мян`;
  return formatNumber(value);
}

/**
 * Format money for the UI.
 *
 * MNT 1234567  -> "1,234,567₮"
 * USD 1234.5   -> "$1,234.50"
 * MNT -2500    -> "-2,500₮"
 */
export function formatMoney(
  amount: MoneyInput,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  options: FormatMoneyOptions = {},
): string {
  const code: CurrencyCode = isCurrencyCode(currency) ? currency : DEFAULT_CURRENCY;
  const decimals = options.decimals ?? CURRENCY_DECIMALS[code];
  const symbol = CURRENCY_SYMBOLS[code];
  const position = CURRENCY_SYMBOL_POSITION[code];

  const rounded = roundMoney(toNumber(amount), decimals);
  const isNegative = rounded < 0;
  const isPositive = rounded > 0 && options.signed;

  const body = formatNumber(Math.abs(rounded), decimals);

  const sign = isNegative ? "-" : isPositive ? "+" : "";
  const formatted =
    position === "prefix" ? `${symbol}${body}` : `${body}${symbol}`;

  return `${sign}${formatted}`;
}

/**
 * Parse user input like "1 234 567₮", "1,234.50", "-2500" into a number.
 * Returns null when the input is not a valid amount.
 */
export function parseAmountInput(input: string): number | null {
  const cleaned = input
    .replace(/[\s\u00a0]/g, "")
    .replace(/[₮$€¥₩₽]/g, "")
    .replace(/,/g, "");

  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") {
    return null;
  }

  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? roundMoney(parsed, 2) : null;
}

/** Safe sum of numeric money values. */
export function sumMoney(values: MoneyInput[]): number {
  return roundMoney(values.reduce<number>((total, value) => total + toNumber(value), 0), 2);
}
