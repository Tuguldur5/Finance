"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createLoan,
  deleteLoan,
  updateLoan,
} from "@/app/actions/loans";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { LoanInput } from "@/lib/validation/loan";
import type { ActionResult } from "@/types/actions";
import type { LoanRow } from "@/types/entities";

export const loanKeys = {
  all: ["loans"] as const,
};

async function fetchLoans(): Promise<LoanRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("loans")
    .select(
      "id, user_id, lender, principal, annual_rate, term_months, start_date, payment_type, note",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as LoanRow[];
}

export function useLoans() {
  return useQuery({
    queryKey: loanKeys.all,
    queryFn: fetchLoans,
    staleTime: 30_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function useInvalidateLoans() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: loanKeys.all });
  };
}

export function useCreateLoan() {
  const invalidate = useInvalidateLoans();

  return useMutation({
    mutationFn: async (input: LoanInput) => unwrap(await createLoan(input)),
    onSuccess: () => {
      toast.success(t("toasts.created"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateLoan() {
  const invalidate = useInvalidateLoans();

  return useMutation({
    mutationFn: async (input: LoanInput) => unwrap(await updateLoan(input)),
    onSuccess: () => {
      toast.success(t("toasts.updated"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteLoan() {
  const invalidate = useInvalidateLoans();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteLoan(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}
