"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfMonth, format, parseISO } from "date-fns";
import { toast } from "sonner";

import {
  copyBudgetsFromPreviousMonth,
  deleteBudget,
  setBudget,
} from "@/app/actions/budgets";
import { toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { BudgetInput } from "@/lib/validation/budget";
import type { ActionResult } from "@/types/actions";
import type { BudgetRow } from "@/types/entities";

export const budgetKeys = {
  all: ["budgets"] as const,
  month: (month: string) => ["budgets", month] as const,
};

export type BudgetWithSpent = BudgetRow & { spent: number };

async function fetchBudgets(month: string): Promise<BudgetWithSpent[]> {
  const supabase = createClient();
  const monthDate = parseISO(month);

  const [{ data: budgets, error }, { data: expenses, error: expenseError }] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("id, user_id, category_id, month, amount")
        .eq("month", month),
      supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("type", "expense")
        .gte("occurred_at", month)
        .lte("occurred_at", format(endOfMonth(monthDate), "yyyy-MM-dd")),
    ]);

  if (error || expenseError) throw new Error(t("errors.loadFailed"));

  const spentByCategory = new Map<string, number>();

  for (const row of expenses ?? []) {
    const categoryId = row.category_id as string | null;
    if (!categoryId) continue;
    spentByCategory.set(
      categoryId,
      (spentByCategory.get(categoryId) ?? 0) + toNumber(row.amount),
    );
  }

  return (budgets ?? []).map((budget) => ({
    ...(budget as BudgetRow),
    spent: spentByCategory.get((budget as BudgetRow).category_id) ?? 0,
  }));
}

export function useBudgets(month: string) {
  return useQuery({
    queryKey: budgetKeys.month(month),
    queryFn: () => fetchBudgets(month),
    staleTime: 30_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function useInvalidateBudgets() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
  };
}

export function useSetBudget() {
  const invalidate = useInvalidateBudgets();

  return useMutation({
    mutationFn: async (input: BudgetInput) => unwrap(await setBudget(input)),
    onSuccess: () => {
      toast.success(t("toasts.saved"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgets();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteBudget(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useCopyBudgets() {
  const invalidate = useInvalidateBudgets();

  return useMutation({
    mutationFn: async (month: string) =>
      unwrap(await copyBudgetsFromPreviousMonth(month)),
    onSuccess: (result) => {
      toast.success(
        result.count > 0
          ? t("budgets.copied", { count: result.count })
          : t("budgets.copyEmpty"),
      );
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}
