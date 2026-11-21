"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CurrencyCode } from "@/lib/config";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import {
  transactionInputSchema,
  type TransactionInput,
} from "@/lib/validation/transaction";
import type { ActionResult } from "@/types/actions";
import type { TransactionRow } from "@/types/entities";

type WalletLite = {
  id: string;
  currency: CurrencyCode;
};

type TransactionInsert = {
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  type: TransactionInput["type"];
  amount: number;
  currency: CurrencyCode;
  occurred_at: string;
  note: string | null;
  to_wallet_id: string | null;
  tags: string[];
};

async function loadWallets(
  supabase: SupabaseClient,
  ids: string[],
): Promise<WalletLite[] | null> {
  const { data, error } = await supabase
    .from("wallets")
    .select("id, currency")
    .in("id", ids);

  if (error) return null;
  return (data ?? []) as WalletLite[];
}

/**
 * Validates ownership, currency and category rules and builds the DB row.
 * RLS is still the final gate; this exists for clear Mongolian errors.
 */
async function buildPayload(
  supabase: SupabaseClient,
  userId: string,
  input: TransactionInput,
): Promise<{ payload?: TransactionInsert; error?: string }> {
  const walletIds = [input.walletId, input.toWalletId].filter(
    (value): value is string => Boolean(value),
  );

  const wallets = await loadWallets(supabase, walletIds);

  if (!wallets) {
    return { error: t("errors.loadFailed") };
  }

  const fromWallet = wallets.find((wallet) => wallet.id === input.walletId);

  if (!fromWallet) {
    return { error: t("validation.selectWallet") };
  }

  let toWalletId: string | null = null;

  if (input.type === "transfer") {
    const toWallet = wallets.find((wallet) => wallet.id === input.toWalletId);

    if (!toWallet) {
      return { error: t("validation.selectWallet") };
    }

    if (toWallet.currency !== fromWallet.currency) {
      return { error: t("transactions.currencyMismatch") };
    }

    toWalletId = toWallet.id;
  } else if (input.categoryId) {
    const { data: category } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", input.categoryId)
      .maybeSingle();

    if (!category || (category.type as string) !== input.type) {
      return { error: t("validation.selectCategory") };
    }
  }

  return {
    payload: {
      user_id: userId,
      wallet_id: input.walletId,
      category_id: input.type === "transfer" ? null : (input.categoryId ?? null),
      type: input.type,
      amount: input.amount,
      currency: fromWallet.currency,
      occurred_at: input.occurredAt,
      note: input.note.trim() === "" ? null : input.note.trim(),
      to_wallet_id: toWalletId,
      tags: input.tags,
    },
  };
}

export async function createTransaction(
  input: TransactionInput,
): Promise<ActionResult<TransactionRow>> {
  const parsed = transactionInputSchema.safeParse(input);

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

  const { payload, error } = await buildPayload(supabase, user.id, parsed.data);

  if (!payload) {
    return { ok: false, error: error ?? t("errors.invalidInput") };
  }

  const { data, error: insertError } = await supabase
    .from("transactions")
    .insert(payload)
    .select("*")
    .single();

  if (insertError || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as TransactionRow };
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<ActionResult<TransactionRow>> {
  const parsed = transactionInputSchema.safeParse(input);

  if (!isValidUuid(id) || !parsed.success) {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const { payload, error } = await buildPayload(supabase, user.id, parsed.data);

  if (!payload) {
    return { ok: false, error: error ?? t("errors.invalidInput") };
  }

  const { data, error: updateError } = await supabase
    .from("transactions")
    .update({
      wallet_id: payload.wallet_id,
      category_id: payload.category_id,
      type: payload.type,
      amount: payload.amount,
      currency: payload.currency,
      occurred_at: payload.occurred_at,
      note: payload.note,
      to_wallet_id: payload.to_wallet_id,
      tags: payload.tags,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as TransactionRow };
}

export async function deleteTransaction(
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
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}
