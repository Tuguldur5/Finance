"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { RecurringInput } from "@/lib/validation/recurring";
import type { ActionResult } from "@/types/actions";
import type { RecurringRuleRow } from "@/types/entities";

import {
  createRecurringRule,
  deleteRecurringRule,
  setRecurringRuleActive,
  updateRecurringRule,
} from "@/app/actions/recurring";

export const recurringKeys = {
  all: ["recurring-rules"] as const,
};

async function fetchRecurringRules(): Promise<RecurringRuleRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("recurring_rules")
    .select(
      "id, user_id, type, amount, currency, wallet_id, category_id, to_wallet_id, note, tags, frequency, interval_count, next_run, last_run, is_active",
    )
    .order("is_active", { ascending: false })
    .order("next_run", { ascending: true });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as RecurringRuleRow[];
}

export function useRecurringRules() {
  return useQuery({
    queryKey: recurringKeys.all,
    queryFn: fetchRecurringRules,
    staleTime: 30_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function useInvalidateRecurring() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: recurringKeys.all });
  };
}

export function useCreateRecurringRule() {
  const invalidate = useInvalidateRecurring();

  return useMutation({
    mutationFn: async (input: RecurringInput) =>
      unwrap(await createRecurringRule(input)),
    onSuccess: () => {
      toast.success(t("toasts.created"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateRecurringRule() {
  const invalidate = useInvalidateRecurring();

  return useMutation({
    mutationFn: async (input: RecurringInput) =>
      unwrap(await updateRecurringRule(input)),
    onSuccess: () => {
      toast.success(t("toasts.updated"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useToggleRecurringRule() {
  const invalidate = useInvalidateRecurring();

  return useMutation({
    mutationFn: async (variables: { id: string; isActive: boolean }) =>
      unwrap(await setRecurringRuleActive(variables.id, variables.isActive)),
    onSuccess: () => {
      toast.success(t("toasts.updatedStatus"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteRecurringRule() {
  const invalidate = useInvalidateRecurring();

  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await deleteRecurringRule(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}
