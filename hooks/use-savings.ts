"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  adjustSavingsBalance,
  createSavingsAccount,
  deleteSavingsAccount,
  updateSavingsAccount,
} from "@/app/actions/savings";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type {
  SavingsAccountInput,
  SavingsAdjustmentInput,
} from "@/lib/validation/savings";
import type { ActionResult } from "@/types/actions";
import type { SavingsAccountRow } from "@/types/entities";

export const savingsKeys = {
  all: ["savings"] as const,
};

const ACCOUNT_COLUMNS =
  "id, user_id, name, type, institution, balance, currency, expected_rate, liquidity, maturity_date, note, is_archived, created_at";

async function fetchSavingsAccounts(): Promise<SavingsAccountRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("savings_accounts")
    .select(ACCOUNT_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as SavingsAccountRow[];
}

export function useSavingsAccounts() {
  return useQuery({
    queryKey: savingsKeys.all,
    queryFn: fetchSavingsAccounts,
    staleTime: 30_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function useInvalidateSavings() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: savingsKeys.all });
  };
}

export function useCreateSavingsAccount() {
  const invalidate = useInvalidateSavings();

  return useMutation({
    mutationFn: async (input: SavingsAccountInput) =>
      unwrap(await createSavingsAccount(input)),
    onSuccess: () => {
      toast.success(t("toasts.created"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateSavingsAccount() {
  const invalidate = useInvalidateSavings();

  return useMutation({
    mutationFn: async (input: SavingsAccountInput) =>
      unwrap(await updateSavingsAccount(input)),
    onSuccess: () => {
      toast.success(t("toasts.updated"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteSavingsAccount() {
  const invalidate = useInvalidateSavings();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteSavingsAccount(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useAdjustSavingsBalance() {
  const invalidate = useInvalidateSavings();

  return useMutation({
    mutationFn: async (input: SavingsAdjustmentInput) =>
      unwrap(await adjustSavingsBalance(input)),
    onSuccess: () => {
      toast.success(t("toasts.saved"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}
