/**
 * Application-wide constants. Values here are safe to import on both
 * the server and the client.
 */

export const APP_NAME = "Санхүү";

/** Default timezone for all date handling. */
export const APP_TIME_ZONE = "Asia/Ulaanbaatar";

/** Default currency for new profiles and wallets. */
export const DEFAULT_CURRENCY = "MNT" as const;

/** Default UI locale. */
export const DEFAULT_LOCALE = "mn" as const;

/** Week starts on Monday in Mongolia. */
export const WEEK_STARTS_ON = 1 as const;

/** Currencies a wallet may be created with. MNT is the primary one. */
export const SUPPORTED_CURRENCIES = [
  "MNT",
  "USD",
  "EUR",
  "CNY",
  "KRW",
  "JPY",
  "RUB",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Number of decimal digits accepted for each currency.
 * MNT / KRW / JPY are normally used without decimals.
 */
export const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  MNT: 0,
  USD: 2,
  EUR: 2,
  CNY: 2,
  KRW: 0,
  JPY: 0,
  RUB: 2,
};

/** Display symbol for each supported currency. */
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  MNT: "₮",
  USD: "$",
  EUR: "€",
  CNY: "¥",
  KRW: "₩",
  JPY: "¥",
  RUB: "₽",
};

/** Where the symbol sits relative to the number. */
export const CURRENCY_SYMBOL_POSITION: Record<
  CurrencyCode,
  "prefix" | "suffix"
> = {
  MNT: "suffix",
  USD: "prefix",
  EUR: "prefix",
  CNY: "prefix",
  KRW: "prefix",
  JPY: "prefix",
  RUB: "prefix",
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/** Locale string used by Intl.NumberFormat for grouping. */
export const NUMBER_LOCALE = "en-US";

/**
 * Mongolian payroll deductions used by the public salary calculator.
 *
 * These are configurable reference values — verify them against the current
 * legislation before relying on them for payroll. Social insurance is the
 * employee share only; the flat personal income tax applies after the
 * monthly tax credit.
 */
export const PAYROLL_CONFIG = {
  socialInsuranceRate: 0.115,
  personalIncomeTaxRate: 0.1,
  monthlyTaxCredit: 20_000,
} as const;

/** Standard VAT rate for Mongolia (10%). */
export const STANDARD_VAT_RATE = 0.1;

/** Default 50/30/20 budget split. */
export const BUDGET_503020 = {
  needs: 50,
  wants: 30,
  savings: 20,
} as const;

/** Cookie names used across the app. */
export const SIDEBAR_COOKIE = "sidebar_state";
export const THEME_STORAGE_KEY = "sankhuu-theme";
