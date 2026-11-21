import type { CurrencyCode } from "@/lib/config";
import type { RecurringFrequency } from "@/lib/validation/recurring";
import type { TransactionType } from "@/lib/validation/transaction";
import type { WalletType } from "@/lib/validation/wallet";

/** Postgres numeric arrives as number or string depending on the driver path. */
export type MoneyDb = number | string;

/** Row of public.profiles. */
export type ProfileRow = {
  id: string;
  display_name: string;
  currency: CurrencyCode;
  theme: "dark" | "light" | "system";
};

/** Row of public.wallets. */
export type WalletRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  type: WalletType;
  currency: CurrencyCode;
  initial_balance: MoneyDb;
  color: string;
  icon: string;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Row of public.wallet_balances (view). */
export type WalletBalanceRow = {
  wallet_id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  type: WalletType;
  currency: CurrencyCode;
  color: string;
  icon: string;
  sort_order: number;
  is_archived: boolean;
  initial_balance: MoneyDb;
  balance: MoneyDb;
};

export type CategoryRow = {
  id: string;
  type: "income" | "expense";
  name: string;
  icon: string;
  color: string;
  parent_id: string | null;
  is_archived: boolean;
  sort_order: number;
};

export type TransactionRow = {
  id: string;
  user_id: string;
  wallet_id: string;
  to_wallet_id: string | null;
  category_id: string | null;
  type: TransactionType;
  amount: MoneyDb;
  currency: CurrencyCode;
  occurred_at: string;
  note: string | null;
  tags: string[] | null;
  is_recurring_instance: boolean;
  created_at: string;
};

export type RecurringRuleRow = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: MoneyDb;
  currency: CurrencyCode;
  wallet_id: string;
  category_id: string | null;
  to_wallet_id: string | null;
  note: string | null;
  tags: string[] | null;
  frequency: RecurringFrequency;
  interval_count: number;
  next_run: string;
  last_run: string | null;
  is_active: boolean;
};

export type BudgetRow = {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  amount: MoneyDb;
};

export type GoalRow = {
  id: string;
  user_id: string;
  name: string;
  target_amount: MoneyDb;
  current_amount: MoneyDb;
  currency: CurrencyCode;
  target_date: string | null;
  wallet_id: string | null;
  color: string;
  icon: string;
};

export type GoalContributionRow = {
  id: string;
  goal_id: string;
  amount: MoneyDb;
  contributed_at: string;
  wallet_id: string | null;
  note: string | null;
};

export type SavingsAccountType =
  | "savings"
  | "investment"
  | "bond"
  | "stock"
  | "other";

export type SavingsLiquidity = "instant" | "term" | "long_term";

/** Row of public.savings_accounts. */
export type SavingsAccountRow = {
  id: string;
  user_id: string;
  name: string;
  type: SavingsAccountType;
  institution: string;
  balance: MoneyDb;
  currency: CurrencyCode;
  expected_rate: MoneyDb;
  liquidity: SavingsLiquidity;
  maturity_date: string | null;
  note: string | null;
  is_archived: boolean;
  created_at: string;
};

export type DebtBalanceRow = {
  id: string;
  user_id: string;
  type: "i_owe" | "owed_to_me";
  counterparty: string;
  principal: MoneyDb;
  interest_rate: MoneyDb;
  start_date: string;
  due_date: string | null;
  status: "active" | "paid" | "overdue";
  note: string | null;
  paid_amount: MoneyDb;
  remaining_amount: MoneyDb;
};

export type DebtPaymentRow = {
  id: string;
  debt_id: string;
  amount: MoneyDb;
  paid_at: string;
  wallet_id: string | null;
  note: string | null;
};

export type LoanRow = {
  id: string;
  user_id: string;
  lender: string;
  principal: MoneyDb;
  annual_rate: MoneyDb;
  term_months: number;
  start_date: string;
  payment_type: "annuity" | "equal_principal";
  note: string | null;
};

export type TransactionFilters = {
  from?: string;
  to?: string;
  walletId?: string;
  categoryId?: string;
  type?: TransactionType;
  search?: string;
  page: number;
  pageSize: number;
};

export type TransactionPage = {
  rows: TransactionRow[];
  count: number;
};
