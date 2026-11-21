"use server";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import {
  contributionInputSchema,
  goalInputSchema,
  type ContributionInput,
  type GoalInput,
} from "@/lib/validation/goal";
import type { ActionResult } from "@/types/actions";
import type { GoalContributionRow, GoalRow } from "@/types/entities";

export async function createGoal(
  input: GoalInput,
): Promise<ActionResult<GoalRow>> {
  const parsed = goalInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const { name, targetAmount, targetDate, color } = parsed.data;

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: user.id,
      name,
      target_amount: targetAmount,
      current_amount: 0,
      currency: "MNT",
      target_date: targetDate ?? null,
      color,
      icon: "target",
    })
    .select(
      "id, user_id, name, target_amount, current_amount, currency, target_date, wallet_id, color, icon",
    )
    .single();

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as GoalRow };
}

export async function updateGoal(
  input: GoalInput,
): Promise<ActionResult<GoalRow>> {
  const parsed = goalInputSchema.safeParse(input);

  if (!parsed.success || !isValidUuid(parsed.data.id)) {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const { id, name, targetAmount, targetDate, color } = parsed.data;

  const { data, error } = await supabase
    .from("savings_goals")
    .update({
      name,
      target_amount: targetAmount,
      target_date: targetDate ?? null,
      color,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, user_id, name, target_amount, current_amount, currency, target_date, wallet_id, color, icon",
    )
    .maybeSingle();

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as GoalRow };
}

export async function deleteGoal(id: string): Promise<ActionResult<null>> {
  if (!isValidUuid(id)) {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}

export async function createContribution(
  input: ContributionInput,
): Promise<ActionResult<GoalContributionRow>> {
  const parsed = contributionInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const { goalId, amount, contributedAt, walletId, note } = parsed.data;

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("id")
    .eq("id", goalId)
    .maybeSingle();

  if (!goal) {
    return { ok: false, error: t("errors.notFound") };
  }

  const { data, error } = await supabase
    .from("goal_contributions")
    .insert({
      user_id: user.id,
      goal_id: goalId,
      amount,
      contributed_at: contributedAt,
      wallet_id: walletId ?? null,
      note: note.trim() === "" ? null : note.trim(),
    })
    .select("id, goal_id, amount, contributed_at, wallet_id, note")
    .single();

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as GoalContributionRow };
}

export async function deleteContribution(
  id: string,
): Promise<ActionResult<null>> {
  if (!isValidUuid(id)) {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const { error } = await supabase
    .from("goal_contributions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}
