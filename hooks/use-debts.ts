"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createDebt,
  createDebtPayment,
  deleteDebt,
  deleteDebtPayment,
  updateDebt,
} from "@/app/actions/debts";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { DebtInput, DebtPaymentInput } from "@/lib/validation/debt";
import type { ActionResult } from "@/types/actions";
import type { DebtBalanceRow, DebtPaymentRow } from "@/types/entities";

export const debtKeys = {
  all: ["debts"] as const,
  payments: ["debt-payments"] as const,
};

async function fetchDebts(): Promise<DebtBalanceRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("debt_balances")
    .select(
      "id, user_id, type, counterparty, principal, interest_rate, start_date, due_date, status, note, paid_amount, remaining_amount",
    )
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as DebtBalanceRow[];
}

async function fetchPayments(): Promise<DebtPaymentRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("debt_payments")
    .select("id, debt_id, amount, paid_at, wallet_id, note")
    .order("paid_at", { ascending: false });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as DebtPaymentRow[];
}

export function useDebts() {
  return useQuery({
    queryKey: debtKeys.all,
    queryFn: fetchDebts,
    staleTime: 30_000,
  });
}

export function useDebtPayments() {
  return useQuery({
    queryKey: debtKeys.payments,
    queryFn: fetchPayments,
    staleTime: 30_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function useInvalidateDebts() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: debtKeys.all });
    void queryClient.invalidateQueries({ queryKey: debtKeys.payments });
  };
}

export function useCreateDebt() {
  const invalidate = useInvalidateDebts();

  return useMutation({
    mutationFn: async (input: DebtInput) => unwrap(await createDebt(input)),
    onSuccess: () => {
      toast.success(t("toasts.created"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateDebt() {
  const invalidate = useInvalidateDebts();

  return useMutation({
    mutationFn: async (input: DebtInput) => unwrap(await updateDebt(input)),
    onSuccess: () => {
      toast.success(t("toasts.updated"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteDebt() {
  const invalidate = useInvalidateDebts();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteDebt(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useCreateDebtPayment() {
  const invalidate = useInvalidateDebts();

  return useMutation({
    mutationFn: async (input: DebtPaymentInput) =>
      unwrap(await createDebtPayment(input)),
    onSuccess: () => {
      toast.success(t("toasts.created"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteDebtPayment() {
  const invalidate = useInvalidateDebts();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteDebtPayment(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}
