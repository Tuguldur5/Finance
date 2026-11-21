"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import {
  debtInputSchema,
  debtPaymentInputSchema,
  type DebtInput,
  type DebtPaymentInput,
} from "@/lib/validation/debt";
import type { ActionResult } from "@/types/actions";
import type { DebtBalanceRow, DebtPaymentRow } from "@/types/entities";

const DEBT_COLUMNS =
  "id, user_id, type, counterparty, principal, interest_rate, start_date, due_date, status, note";

/** Keeps debts.status in sync with the payment total. */
async function syncDebtStatus(
  supabase: SupabaseClient,
  userId: string,
  debtId: string,
) {
  const { data: debt } = await supabase
    .from("debts")
    .select("principal")
    .eq("id", debtId)
    .maybeSingle();

  if (!debt) return;

  const { data: payments } = await supabase
    .from("debt_payments")
    .select("amount")
    .eq("debt_id", debtId);

  const paid = (payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const settled = paid >= Number(debt.principal) - 0.005;

  await supabase
    .from("debts")
    .update({ status: settled ? "paid" : "active" })
    .eq("id", debtId)
    .eq("user_id", userId);
}

export async function createDebt(
  input: DebtInput,
): Promise<ActionResult<DebtBalanceRow>> {
  const parsed = debtInputSchema.safeParse(input);

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

  const { type, counterparty, principal, interestRate, startDate, dueDate, note } =
    parsed.data;

  const { data, error } = await supabase
    .from("debts")
    .insert({
      user_id: user.id,
      type,
      counterparty,
      principal,
      interest_rate: interestRate,
      start_date: startDate,
      due_date: dueDate ?? null,
      status: "active",
      note: note.trim() === "" ? null : note.trim(),
    })
    .select(DEBT_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return {
    ok: true,
    data: { ...data, paid_amount: 0, remaining_amount: principal } as DebtBalanceRow,
  };
}

export async function updateDebt(
  input: DebtInput,
): Promise<ActionResult<DebtBalanceRow>> {
  const parsed = debtInputSchema.safeParse(input);

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

  const { id, type, counterparty, principal, interestRate, startDate, dueDate, note } =
    parsed.data;

  const { data, error } = await supabase
    .from("debts")
    .update({
      type,
      counterparty,
      principal,
      interest_rate: interestRate,
      start_date: startDate,
      due_date: dueDate ?? null,
      note: note.trim() === "" ? null : note.trim(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(DEBT_COLUMNS)
    .maybeSingle();

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as DebtBalanceRow };
}

export async function deleteDebt(id: string): Promise<ActionResult<null>> {
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
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}

export async function createDebtPayment(
  input: DebtPaymentInput,
): Promise<ActionResult<DebtPaymentRow>> {
  const parsed = debtPaymentInputSchema.safeParse(input);

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

  const { debtId, amount, paidAt, walletId, note } = parsed.data;

  const { data: debt } = await supabase
    .from("debts")
    .select("id")
    .eq("id", debtId)
    .maybeSingle();

  if (!debt) {
    return { ok: false, error: t("errors.notFound") };
  }

  const { data, error } = await supabase
    .from("debt_payments")
    .insert({
      user_id: user.id,
      debt_id: debtId,
      amount,
      paid_at: paidAt,
      wallet_id: walletId ?? null,
      note: note.trim() === "" ? null : note.trim(),
    })
    .select("id, debt_id, amount, paid_at, wallet_id, note")
    .single();

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  await syncDebtStatus(supabase, user.id, debtId);

  return { ok: true, data: data as DebtPaymentRow };
}

export async function deleteDebtPayment(
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

  const { data: payment } = await supabase
    .from("debt_payments")
    .select("debt_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("debt_payments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  if (payment?.debt_id) {
    await syncDebtStatus(supabase, user.id, payment.debt_id as string);
  }

  return { ok: true, data: null };
}
