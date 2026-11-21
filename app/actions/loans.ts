"use server";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import { loanInputSchema, type LoanInput } from "@/lib/validation/loan";
import type { ActionResult } from "@/types/actions";
import type { LoanRow } from "@/types/entities";

const LOAN_COLUMNS =
  "id, user_id, lender, principal, annual_rate, term_months, start_date, payment_type, note";

export async function createLoan(
  input: LoanInput,
): Promise<ActionResult<LoanRow>> {
  const parsed = loanInputSchema.safeParse(input);

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

  const { lender, principal, annualRate, termMonths, startDate, paymentType, note } =
    parsed.data;

  const { data, error } = await supabase
    .from("loans")
    .insert({
      user_id: user.id,
      lender,
      principal,
      annual_rate: annualRate,
      term_months: termMonths,
      start_date: startDate,
      payment_type: paymentType,
      note: note.trim() === "" ? null : note.trim(),
    })
    .select(LOAN_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as LoanRow };
}

export async function updateLoan(
  input: LoanInput,
): Promise<ActionResult<LoanRow>> {
  const parsed = loanInputSchema.safeParse(input);

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

  const { id, lender, principal, annualRate, termMonths, startDate, paymentType, note } =
    parsed.data;

  const { data, error } = await supabase
    .from("loans")
    .update({
      lender,
      principal,
      annual_rate: annualRate,
      term_months: termMonths,
      start_date: startDate,
      payment_type: paymentType,
      note: note.trim() === "" ? null : note.trim(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(LOAN_COLUMNS)
    .maybeSingle();

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as LoanRow };
}

export async function deleteLoan(id: string): Promise<ActionResult<null>> {
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
    .from("loans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}
