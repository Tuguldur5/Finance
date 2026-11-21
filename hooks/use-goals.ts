"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createContribution,
  createGoal,
  deleteContribution,
  deleteGoal,
  updateGoal,
} from "@/app/actions/goals";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { ContributionInput, GoalInput } from "@/lib/validation/goal";
import type { ActionResult } from "@/types/actions";
import type { GoalContributionRow, GoalRow } from "@/types/entities";

export const goalKeys = {
  all: ["goals"] as const,
  contributions: ["goal-contributions"] as const,
};

const GOAL_COLUMNS =
  "id, user_id, name, target_amount, current_amount, currency, target_date, wallet_id, color, icon";

async function fetchGoals(): Promise<GoalRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("savings_goals")
    .select(GOAL_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as GoalRow[];
}

async function fetchContributions(): Promise<GoalContributionRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("goal_contributions")
    .select("id, goal_id, amount, contributed_at, wallet_id, note")
    .order("contributed_at", { ascending: false });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as GoalContributionRow[];
}

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.all,
    queryFn: fetchGoals,
    staleTime: 30_000,
  });
}

export function useGoalContributions() {
  return useQuery({
    queryKey: goalKeys.contributions,
    queryFn: fetchContributions,
    staleTime: 30_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function useInvalidateGoals() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: goalKeys.all });
    void queryClient.invalidateQueries({ queryKey: goalKeys.contributions });
  };
}

export function useCreateGoal() {
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: async (input: GoalInput) => unwrap(await createGoal(input)),
    onSuccess: () => {
      toast.success(t("toasts.created"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: async (input: GoalInput) => unwrap(await updateGoal(input)),
    onSuccess: () => {
      toast.success(t("toasts.updated"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteGoal(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useCreateContribution() {
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: async (input: ContributionInput) =>
      unwrap(await createContribution(input)),
    onSuccess: () => {
      toast.success(t("toasts.created"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteContribution() {
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteContribution(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}
