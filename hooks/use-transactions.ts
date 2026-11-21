"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { TransactionInput } from "@/lib/validation/transaction";
import type { ActionResult } from "@/types/actions";
import type {
  TransactionFilters,
  TransactionPage,
  TransactionRow,
  WalletBalanceRow,
} from "@/types/entities";

import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/app/actions/transactions";

import { walletKeys } from "./use-wallets";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.all, "list", filters] as const,
};

const TRANSACTION_COLUMNS =
  "id, user_id, wallet_id, to_wallet_id, category_id, type, amount, currency, occurred_at, note, tags, is_recurring_instance, created_at";

function escapeSearch(value: string): string {
  return value.replace(/[%_,()]/g, " ").trim();
}

async function fetchTransactions(
  filters: TransactionFilters,
): Promise<TransactionPage> {
  const supabase = createClient();

  let query = supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS, { count: "exact" });

  if (filters.from) query = query.gte("occurred_at", filters.from);
  if (filters.to) query = query.lte("occurred_at", filters.to);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);

  if (filters.walletId) {
    // Include transfers where the wallet is either the source or destination.
    query = query.or(
      `wallet_id.eq.${filters.walletId},to_wallet_id.eq.${filters.walletId}`,
    );
  }

  const search = filters.search ? escapeSearch(filters.search) : "";
  if (search) {
    query = query.ilike("note", `%${search}%`);
  }

  const from = filters.page * filters.pageSize;
  const to = from + filters.pageSize - 1;

  const { data, error, count } = await query
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(t("errors.loadFailed"));

  return {
    rows: (data ?? []) as TransactionRow[],
    count: count ?? 0,
  };
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function invalidateFinance(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  void queryClient.invalidateQueries({ queryKey: walletKeys.all });
}

function optimisticRow(
  input: TransactionInput,
  currency: WalletBalanceRow["currency"],
): TransactionRow {
  return {
    id: `optimistic-${Date.now()}`,
    user_id: "",
    wallet_id: input.walletId,
    to_wallet_id: input.type === "transfer" ? (input.toWalletId ?? null) : null,
    category_id:
      input.type === "transfer" ? null : (input.categoryId ?? null),
    type: input.type,
    amount: input.amount,
    currency,
    occurred_at: input.occurredAt,
    note: input.note.trim() === "" ? null : input.note.trim(),
    tags: input.tags,
    is_recurring_instance: false,
    created_at: new Date().toISOString(),
  };
}

function rowMatchesFilters(
  row: TransactionRow,
  filters: TransactionFilters,
): boolean {
  if (filters.page !== 0) return false;
  if (filters.type && filters.type !== row.type) return false;
  if (
    filters.walletId &&
    filters.walletId !== row.wallet_id &&
    filters.walletId !== row.to_wallet_id
  ) {
    return false;
  }
  if (filters.categoryId && filters.categoryId !== row.category_id) {
    return false;
  }
  if (filters.from && row.occurred_at < filters.from) return false;
  if (filters.to && row.occurred_at > filters.to) return false;
  if (filters.search) return false;
  return true;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransactionInput) =>
      unwrap(await createTransaction(input)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });

      const wallets = queryClient.getQueryData<WalletBalanceRow[]>(
        walletKeys.list(),
      );
      const wallet = wallets?.find(
        (item) => item.wallet_id === input.walletId,
      );

      if (!wallet) return { snapshots: undefined };

      const snapshots = queryClient.getQueriesData<TransactionPage>({
        queryKey: transactionKeys.all,
      });

      const cachedQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: transactionKeys.all });

      cachedQueries.forEach((query) => {
        const filters = query.queryKey[2] as TransactionFilters | undefined;
        const old = query.state.data as TransactionPage | undefined;

        if (!filters || !old) return;

        const row = optimisticRow(input, wallet.currency);
        if (!rowMatchesFilters(row, filters)) return;

        queryClient.setQueryData<TransactionPage>(query.queryKey, {
          rows: [row, ...old.rows].slice(0, filters.pageSize),
          count: old.count + 1,
        });
      });

      return { snapshots };
    },
    onError: (error, _input, context) => {
      context?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(error.message);
    },
    onSuccess: () => toast.success(t("toasts.created")),
    onSettled: () => invalidateFinance(queryClient),
  });
}

type UpdateTransactionVariables = {
  id: string;
  input: TransactionInput;
};

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: UpdateTransactionVariables) =>
      unwrap(await updateTransaction(id, input)),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });
      const snapshots = queryClient.getQueriesData<TransactionPage>({
        queryKey: transactionKeys.all,
      });

      queryClient.setQueriesData<TransactionPage>(
        { queryKey: transactionKeys.all },
        (old) =>
          old
            ? {
                ...old,
                rows: old.rows.map((row) =>
                  row.id === id
                    ? {
                        ...row,
                        type: input.type,
                        amount: input.amount,
                        wallet_id: input.walletId,
                        to_wallet_id:
                          input.type === "transfer"
                            ? (input.toWalletId ?? null)
                            : null,
                        category_id:
                          input.type === "transfer"
                            ? null
                            : (input.categoryId ?? null),
                        occurred_at: input.occurredAt,
                        note: input.note.trim() === "" ? null : input.note,
                        tags: input.tags,
                      }
                    : row,
                ),
              }
            : old,
      );

      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(error.message);
    },
    onSuccess: () => toast.success(t("toasts.updated")),
    onSettled: () => invalidateFinance(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteTransaction(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });
      const snapshots = queryClient.getQueriesData<TransactionPage>({
        queryKey: transactionKeys.all,
      });

      queryClient.setQueriesData<TransactionPage>(
        { queryKey: transactionKeys.all },
        (old) =>
          old
            ? {
                rows: old.rows.filter((row) => row.id !== id),
                count: Math.max(old.count - 1, 0),
              }
            : old,
      );

      return { snapshots };
    },
    onError: (error, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(error.message);
    },
    onSuccess: () => toast.success(t("toasts.deleted")),
    onSettled: () => invalidateFinance(queryClient),
  });
}
