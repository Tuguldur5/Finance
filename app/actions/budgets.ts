"use server";

import { format, parseISO, subMonths } from "date-fns";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import {
  budgetInputSchema,
  monthSchema,
  type BudgetInput,
} from "@/lib/validation/budget";
import type { ActionResult } from "@/types/actions";
import type { BudgetRow } from "@/types/entities";

export async function setBudget(
  input: BudgetInput,
): Promise<ActionResult<BudgetRow>> {
  const parsed = budgetInputSchema.safeParse(input);

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

  const { categoryId, month, amount } = parsed.data;

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        month,
        amount,
      },
      { onConflict: "user_id,category_id,month" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as BudgetRow };
}

export async function deleteBudget(id: string): Promise<ActionResult<null>> {
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
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}

export type CopyBudgetsResult = {
  count: number;
};

/** Copies every budget from the month before `targetMonth` into it. */
export async function copyBudgetsFromPreviousMonth(
  targetMonth: string,
): Promise<ActionResult<CopyBudgetsResult>> {
  const parsed = monthSchema.safeParse(targetMonth);

  if (!parsed.success) {
    return { ok: false, error: t("validation.invalidMonth") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const previousMonth = format(
    subMonths(parseISO(parsed.data), 1),
    "yyyy-MM-dd",
  );

  const { data: source, error: sourceError } = await supabase
    .from("budgets")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .eq("month", previousMonth);

  if (sourceError) {
    return { ok: false, error: t("errors.loadFailed") };
  }

  if (!source || source.length === 0) {
    return { ok: true, data: { count: 0 } };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("budgets")
    .upsert(
      source.map((row) => ({
        user_id: user.id,
        category_id: row.category_id as string,
        month: parsed.data,
        amount: row.amount,
      })),
      { onConflict: "user_id,category_id,month", ignoreDuplicates: true },
    )
    .select("id");

  if (insertError) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: { count: inserted?.length ?? 0 } };
}
