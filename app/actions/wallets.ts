"use server";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import { walletInputSchema, type WalletInput } from "@/lib/validation/wallet";
import type { ActionResult } from "@/types/actions";
import type { WalletRow } from "@/types/entities";

export type ArchiveWalletInput = {
  id: string;
  isArchived: boolean;
};

export async function createWallet(
  input: WalletInput,
): Promise<ActionResult<WalletRow>> {
  const parsed = walletInputSchema.safeParse(input);

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

  const { name, type, currency, initialBalance, color, icon } = parsed.data;

  const { data, error } = await supabase
    .from("wallets")
    .insert({
      user_id: user.id,
      name,
      type,
      currency,
      initial_balance: initialBalance,
      color,
      icon,
      sort_order: 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as WalletRow };
}

export async function updateWallet(
  input: WalletInput,
): Promise<ActionResult<WalletRow>> {
  const parsed = walletInputSchema.safeParse(input);

  if (!parsed.success || !parsed.data.id) {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const { id, name, type, currency, initialBalance, color, icon } = parsed.data;

  const { data, error } = await supabase
    .from("wallets")
    .update({
      name,
      type,
      currency,
      initial_balance: initialBalance,
      color,
      icon,
    })
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

  return { ok: true, data: data as WalletRow };
}

export async function setWalletArchived({
  id,
  isArchived,
}: ArchiveWalletInput): Promise<ActionResult<WalletRow>> {
  if (!isValidUuid(id) || typeof isArchived !== "boolean") {
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
    .from("wallets")
    .update({ is_archived: isArchived })
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

  return { ok: true, data: data as WalletRow };
}

/** Persists the visible wallet order (non-archived list). */
export async function reorderWallets(
  ids: string[],
): Promise<ActionResult<null>> {
  if (ids.length === 0 || !ids.every(isValidUuid)) {
    return { ok: false, error: t("errors.invalidInput") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("wallets")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("user_id", user.id),
    ),
  );

  if (results.some((result) => result.error)) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: null };
}
