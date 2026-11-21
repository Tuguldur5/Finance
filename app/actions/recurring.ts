"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CurrencyCode } from "@/lib/config";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import {
  recurringInputSchema,
  type RecurringInput,
} from "@/lib/validation/recurring";
import type { ActionResult } from "@/types/actions";
import type { RecurringRuleRow } from "@/types/entities";

type WalletLite = { id: string; currency: CurrencyCode };

async function resolveCurrency(
  supabase: SupabaseClient,
  input: RecurringInput,
): Promise<{ currency?: CurrencyCode; error?: string }> {
  const ids = [input.walletId, input.toWalletId].filter(
    (value): value is string => Boolean(value),
  );

  const { data, error } = await supabase
    .from("wallets")
    .select("id, currency")
    .in("id", ids);

  if (error) {
    return { error: t("errors.loadFailed") };
  }

  const wallets = (data ?? []) as WalletLite[];
  const fromWallet = wallets.find((wallet) => wallet.id === input.walletId);

  if (!fromWallet) {
    return { error: t("validation.selectWallet") };
  }

  if (input.type === "transfer") {
    const toWallet = wallets.find((wallet) => wallet.id === input.toWalletId);

    if (!toWallet) {
      return { error: t("validation.selectWallet") };
    }

    if (toWallet.currency !== fromWallet.currency) {
      return { error: t("transactions.currencyMismatch") };
    }
  }

  return { currency: fromWallet.currency };
}

/** Rules may only reference a category of the same user and matching type. */
async function validateCategory(
  supabase: SupabaseClient,
  input: RecurringInput,
): Promise<string | null> {
  if (input.type === "transfer" || !input.categoryId) return null;

  const { data: category } = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", input.categoryId)
    .maybeSingle();

  if (!category || (category.type as string) !== input.type) {
    return t("validation.selectCategory");
  }

  return null;
}

export async function createRecurringRule(
  input: RecurringInput,
): Promise<ActionResult<RecurringRuleRow>> {
  const parsed = recurringInputSchema.safeParse(input);

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

  const { currency, error } = await resolveCurrency(supabase, parsed.data);

  if (!currency) {
    return { ok: false, error: error ?? t("errors.invalidInput") };
  }

  const categoryError = await validateCategory(supabase, parsed.data);

  if (categoryError) {
    return { ok: false, error: categoryError };
  }

  const values = parsed.data;

  const { data, error: insertError } = await supabase
    .from("recurring_rules")
    .insert({
      user_id: user.id,
      type: values.type,
      amount: values.amount,
      currency,
      wallet_id: values.walletId,
      category_id: values.type === "transfer" ? null : (values.categoryId ?? null),
      to_wallet_id: values.type === "transfer" ? (values.toWalletId ?? null) : null,
      note: values.note.trim() === "" ? null : values.note.trim(),
      tags: [],
      frequency: values.frequency,
      interval_count: values.intervalCount,
      next_run: values.nextRun,
      is_active: true,
    })
    .select("*")
    .single();

  if (insertError || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as RecurringRuleRow };
}

export async function updateRecurringRule(
  input: RecurringInput,
): Promise<ActionResult<RecurringRuleRow>> {
  const parsed = recurringInputSchema.safeParse(input);

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

  const { currency, error } = await resolveCurrency(supabase, parsed.data);

  if (!currency) {
    return { ok: false, error: error ?? t("errors.invalidInput") };
  }

  const categoryError = await validateCategory(supabase, parsed.data);

  if (categoryError) {
    return { ok: false, error: categoryError };
  }

  const values = parsed.data;

  const { data, error: updateError } = await supabase
    .from("recurring_rules")
    .update({
      type: values.type,
      amount: values.amount,
      currency,
      wallet_id: values.walletId,
      category_id: values.type === "transfer" ? null : (values.categoryId ?? null),
      to_wallet_id: values.type === "transfer" ? (values.toWalletId ?? null) : null,
      note: values.note.trim() === "" ? null : values.note.trim(),
      frequency: values.frequency,
      interval_count: values.intervalCount,
      next_run: values.nextRun,
      is_active: values.isActive,
    })
    .eq("id", values.id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as RecurringRuleRow };
}

export async function setRecurringRuleActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult<RecurringRuleRow>> {
  if (!isValidUuid(id) || typeof isActive !== "boolean") {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const { data, error } = await supabase
    .from("recurring_rules")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as RecurringRuleRow };
}

export async function deleteRecurringRule(
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
    .from("recurring_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}
