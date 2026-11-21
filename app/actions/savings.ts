"use server";

import { roundMoney, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import {
  savingsAccountInputSchema,
  savingsAdjustmentInputSchema,
  type SavingsAccountInput,
  type SavingsAdjustmentInput,
} from "@/lib/validation/savings";
import type { ActionResult } from "@/types/actions";
import type { SavingsAccountRow } from "@/types/entities";

const ACCOUNT_COLUMNS =
  "id, user_id, name, type, institution, balance, currency, expected_rate, liquidity, maturity_date, note, is_archived, created_at";

export async function createSavingsAccount(
  input: SavingsAccountInput,
): Promise<ActionResult<SavingsAccountRow>> {
  const parsed = savingsAccountInputSchema.safeParse(input);

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

  const {
    name,
    type,
    institution,
    balance,
    expectedRate,
    liquidity,
    maturityDate,
    note,
  } = parsed.data;

  const { data, error } = await supabase
    .from("savings_accounts")
    .insert({
      user_id: user.id,
      name,
      type,
      institution,
      balance,
      currency: "MNT",
      expected_rate: expectedRate,
      liquidity,
      maturity_date: maturityDate ?? null,
      note: note === "" ? null : note,
    })
    .select(ACCOUNT_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as SavingsAccountRow };
}

export async function updateSavingsAccount(
  input: SavingsAccountInput,
): Promise<ActionResult<SavingsAccountRow>> {
  const parsed = savingsAccountInputSchema.safeParse(input);

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

  const {
    id,
    name,
    type,
    institution,
    balance,
    expectedRate,
    liquidity,
    maturityDate,
    note,
  } = parsed.data;

  const { data, error } = await supabase
    .from("savings_accounts")
    .update({
      name,
      type,
      institution,
      balance,
      expected_rate: expectedRate,
      liquidity,
      maturity_date: maturityDate ?? null,
      note: note === "" ? null : note,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(ACCOUNT_COLUMNS)
    .maybeSingle();

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as SavingsAccountRow };
}

export async function deleteSavingsAccount(
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
    .from("savings_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}

export async function adjustSavingsBalance(
  input: SavingsAdjustmentInput,
): Promise<ActionResult<SavingsAccountRow>> {
  const parsed = savingsAdjustmentInputSchema.safeParse(input);

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

  const { id, amount, direction } = parsed.data;

  const { data: current, error: loadError } = await supabase
    .from("savings_accounts")
    .select("balance")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: t("errors.loadFailed") };
  }

  if (!current) {
    return { ok: false, error: t("errors.notFound") };
  }

  const delta = direction === "deposit" ? amount : -amount;
  const nextBalance = roundMoney(toNumber(current.balance) + delta);

  if (nextBalance < 0) {
    return { ok: false, error: t("savings.insufficient") };
  }

  const { data, error } = await supabase
    .from("savings_accounts")
    .update({ balance: nextBalance })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(ACCOUNT_COLUMNS)
    .maybeSingle();

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as SavingsAccountRow };
}
