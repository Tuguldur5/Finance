"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { WalletInput } from "@/lib/validation/wallet";
import type { ActionResult } from "@/types/actions";
import type { WalletBalanceRow } from "@/types/entities";

import {
  createWallet,
  reorderWallets,
  setWalletArchived,
  updateWallet,
  type ArchiveWalletInput,
} from "@/app/actions/wallets";

export const walletKeys = {
  all: ["wallets"] as const,
  list: () => [...walletKeys.all, "list"] as const,
};

async function fetchWallets(): Promise<WalletBalanceRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("wallet_balances")
    .select("*")
    .order("is_archived", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as WalletBalanceRow[];
}

export function useWallets() {
  return useQuery({
    queryKey: walletKeys.list(),
    queryFn: fetchWallets,
    staleTime: 30_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WalletInput) => unwrap(await createWallet(input)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: walletKeys.list() });
      const previous = queryClient.getQueryData<WalletBalanceRow[]>(
        walletKeys.list(),
      );

      if (previous) {
        const optimistic: WalletBalanceRow = {
          wallet_id: `optimistic-${Date.now()}`,
          user_id: "",
          workspace_id: null,
          name: input.name,
          type: input.type,
          currency: input.currency,
          color: input.color,
          icon: input.icon,
          sort_order: 9999,
          is_archived: false,
          initial_balance: input.initialBalance,
          balance: input.initialBalance,
        };

        queryClient.setQueryData<WalletBalanceRow[]>(walletKeys.list(), [
          ...previous,
          optimistic,
        ]);
      }

      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(walletKeys.list(), context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: () => toast.success(t("toasts.created")),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WalletInput) => unwrap(await updateWallet(input)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: walletKeys.list() });
      const previous = queryClient.getQueryData<WalletBalanceRow[]>(
        walletKeys.list(),
      );

      queryClient.setQueryData<WalletBalanceRow[]>(walletKeys.list(), (old) =>
        old?.map((wallet) =>
          wallet.wallet_id === input.id
            ? {
                ...wallet,
                name: input.name,
                type: input.type,
                currency: input.currency,
                color: input.color,
                icon: input.icon,
              }
            : wallet,
        ),
      );

      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(walletKeys.list(), context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: () => toast.success(t("toasts.updated")),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useSetWalletArchived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ArchiveWalletInput) =>
      unwrap(await setWalletArchived(input)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: walletKeys.list() });
      const previous = queryClient.getQueryData<WalletBalanceRow[]>(
        walletKeys.list(),
      );

      queryClient.setQueryData<WalletBalanceRow[]>(walletKeys.list(), (old) =>
        old?.map((wallet) =>
          wallet.wallet_id === input.id
            ? { ...wallet, is_archived: input.isArchived }
            : wallet,
        ),
      );

      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(walletKeys.list(), context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: (_data, input) =>
      toast.success(
        input.isArchived ? t("toasts.archived") : t("toasts.restored"),
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useReorderWallets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => unwrap(await reorderWallets(ids)),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: walletKeys.list() });
      const previous = queryClient.getQueryData<WalletBalanceRow[]>(
        walletKeys.list(),
      );

      if (previous) {
        const byId = new Map(
          previous.map((wallet) => [wallet.wallet_id, wallet]),
        );
        const reordered = ids
          .map((id) => byId.get(id))
          .filter((wallet): wallet is WalletBalanceRow => Boolean(wallet));
        const rest = previous.filter(
          (wallet) => !ids.includes(wallet.wallet_id),
        );
        queryClient.setQueryData<WalletBalanceRow[]>(walletKeys.list(), [
          ...reordered,
          ...rest,
        ]);
      }

      return { previous };
    },
    onError: (error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(walletKeys.list(), context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: () => toast.success(t("toasts.saved")),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
