"use server";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/common";
import { categoryInputSchema, type CategoryInput } from "@/lib/validation/category";
import type { ActionResult } from "@/types/actions";
import type { CategoryRow } from "@/types/entities";

const CATEGORY_COLUMNS =
  "id, type, name, icon, color, parent_id, is_archived, sort_order";

function isDuplicate(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export async function createCategory(
  input: CategoryInput,
): Promise<ActionResult<CategoryRow>> {
  const parsed = categoryInputSchema.safeParse(input);

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

  const { type, name, icon, color } = parsed.data;

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("type", type)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      type,
      name,
      icon,
      color,
      sort_order: Number(last?.sort_order ?? 0) + 10,
    })
    .select(CATEGORY_COLUMNS)
    .single();

  if (isDuplicate(error)) {
    return { ok: false, error: t("errors.duplicateName") };
  }

  if (error || !data) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  return { ok: true, data: data as CategoryRow };
}

export async function updateCategory(
  input: CategoryInput,
): Promise<ActionResult<CategoryRow>> {
  const parsed = categoryInputSchema.safeParse(input);

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

  const { id, name, icon, color } = parsed.data;

  const { data, error } = await supabase
    .from("categories")
    .update({ name, icon, color })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(CATEGORY_COLUMNS)
    .maybeSingle();

  if (isDuplicate(error)) {
    return { ok: false, error: t("errors.duplicateName") };
  }

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as CategoryRow };
}

export async function setCategoryArchived(input: {
  id: string;
  isArchived: boolean;
}): Promise<ActionResult<CategoryRow>> {
  if (!isValidUuid(input.id) || typeof input.isArchived !== "boolean") {
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
    .from("categories")
    .update({ is_archived: input.isArchived })
    .eq("id", input.id)
    .eq("user_id", user.id)
    .select(CATEGORY_COLUMNS)
    .maybeSingle();

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as CategoryRow };
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
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
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  return { ok: true, data: null };
}
