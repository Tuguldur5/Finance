"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import { CategorySelect } from "@/components/forms/category-select";
import { DateRangePicker } from "@/components/forms/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { transactionTypeLabels } from "@/lib/labels";
import type { CategoryRow, WalletBalanceRow } from "@/types/entities";

export type TransactionFilterState = {
  from?: string;
  to?: string;
  walletId: string;
  categoryId: string;
  type: string;
  search: string;
};

type TransactionsFiltersProps = {
  value: TransactionFilterState;
  onChange: (patch: Partial<TransactionFilterState>) => void;
  onReset: () => void;
  wallets: WalletBalanceRow[];
  categories: CategoryRow[];
};

export function TransactionsFilters({
  value,
  onChange,
  onReset,
  wallets,
  categories,
}: TransactionsFiltersProps) {
  const [search, setSearch] = React.useState(value.search);

  // Keep the local input in sync when filters are cleared from outside.
  React.useEffect(() => {
    setSearch(value.search);
  }, [value.search]);

  // Debounced search commit.
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== value.search) onChange({ search });
    }, 350);

    return () => clearTimeout(timeout);
  }, [search, value.search, onChange]);

  const categoryOptions = categories.filter(
    (category) =>
      !category.is_archived &&
      (value.type === "income" || value.type === "expense"
        ? category.type === value.type
        : true),
  );

  const hasActiveFilters = Boolean(
    value.from ||
      value.to ||
      value.walletId ||
      value.categoryId ||
      value.type !== "all" ||
      value.search.trim(),
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("transactions.searchPlaceholder")}
          className="pl-8"
          autoComplete="off"
        />
      </div>

      <DateRangePicker
        from={value.from}
        to={value.to}
        onChange={(range) => onChange({ from: range.from, to: range.to })}
        placeholder={t("transactions.anyDate")}
      />

      <Select
        value={value.type}
        onValueChange={(next) =>
          onChange({
            type: next,
            categoryId: next === "transfer" ? "" : value.categoryId,
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("transactions.anyType")}</SelectItem>
          <SelectItem value="expense">
            {transactionTypeLabels.expense}
          </SelectItem>
          <SelectItem value="income">{transactionTypeLabels.income}</SelectItem>
          <SelectItem value="transfer">
            {transactionTypeLabels.transfer}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.walletId || "all"}
        onValueChange={(next) =>
          onChange({ walletId: next === "all" ? "" : next })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("transactions.anyWallet")}</SelectItem>
          {wallets.map((wallet) => (
            <SelectItem key={wallet.wallet_id} value={wallet.wallet_id}>
              {wallet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <CategorySelect
          categories={categoryOptions}
          value={value.categoryId}
          onChange={(categoryId) => onChange({ categoryId })}
          placeholder={t("transactions.anyCategory")}
          allowAll
          allLabel={t("transactions.anyCategory")}
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onReset}
          disabled={!hasActiveFilters}
          aria-label={t("transactions.clearFilters")}
          title={t("transactions.clearFilters")}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
