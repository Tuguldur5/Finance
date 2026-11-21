"use server";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { profileInputSchema, type ProfileInput } from "@/lib/validation/profile";
import type { ActionResult } from "@/types/actions";
import type { ProfileRow } from "@/types/entities";

export async function updateProfile(
  input: ProfileInput,
): Promise<ActionResult<ProfileRow>> {
  const parsed = profileInputSchema.safeParse(input);

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

  const { displayName, currency, theme } = parsed.data;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      currency,
      theme,
    })
    .eq("id", user.id)
    .select("id, display_name, currency, theme")
    .maybeSingle();

  if (error) {
    return { ok: false, error: t("errors.saveFailed") };
  }

  if (!data) {
    return { ok: false, error: t("errors.notFound") };
  }

  return { ok: true, data: data as ProfileRow };
}
