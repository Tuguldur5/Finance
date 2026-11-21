import type { AuthError } from "@supabase/supabase-js";

import { t } from "@/lib/i18n";

/**
 * Map Supabase auth errors to short Mongolian messages.
 * Codes are preferred; message matching is only a fallback for older
 * GoTrue versions that do not return a code.
 */
export function authErrorMessage(error: AuthError | null | undefined): string {
  if (!error) return t("auth.errors.unknown");

  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials")
  ) {
    return t("auth.errors.invalidCredentials");
  }

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return t("auth.errors.emailNotConfirmed");
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return t("auth.errors.emailInUse");
  }

  if (code === "weak_password" || message.includes("password should be")) {
    return t("auth.errors.weakPassword");
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    return t("auth.errors.rateLimit");
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch failed")
  ) {
    return t("errors.network");
  }

  return t("auth.errors.unknown");
}
