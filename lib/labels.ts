import { t } from "@/lib/i18n";
import type { RecurringFrequency } from "@/lib/validation/recurring";
import type { TransactionType } from "@/lib/validation/transaction";
import type { WalletType } from "@/lib/validation/wallet";

export const walletTypeLabels: Record<WalletType, string> = {
  cash: t("walletTypes.cash"),
  bank_account: t("walletTypes.bankAccount"),
  card: t("walletTypes.card"),
  e_wallet: t("walletTypes.eWallet"),
  savings: t("walletTypes.savings"),
  investment: t("walletTypes.investment"),
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  income: t("transactions.typeIncome"),
  expense: t("transactions.typeExpense"),
  transfer: t("transactions.typeTransfer"),
};

export const frequencyLabels: Record<RecurringFrequency, string> = {
  daily: t("frequency.daily"),
  weekly: t("frequency.weekly"),
  monthly: t("frequency.monthly"),
  yearly: t("frequency.yearly"),
};

/** Swatches offered in the wallet form. */
export const COLOR_PRESETS = [
  "#2563eb",
  "#0e9384",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0ea5e9",
  "#65a30d",
  "#64748b",
] as const;

/** Icons offered in the category manager (keys match <EntityIcon />). */
export const CATEGORY_ICONS = [
  "circle",
  "wallet",
  "banknote",
  "credit-card",
  "house",
  "utensils",
  "bus",
  "fuel",
  "heart-pulse",
  "graduation-cap",
  "briefcase",
  "building-2",
  "smartphone",
  "wifi",
  "zap",
  "piggy-bank",
  "trending-up",
  "landmark",
  "percent",
  "gift",
  "sparkles",
  "target",
  "baby",
  "armchair",
  "key-round",
  "ellipsis",
] as const;
