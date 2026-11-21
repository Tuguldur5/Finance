"use client";

import * as React from "react";
import { toast } from "sonner";

import { t } from "@/lib/i18n";

/** Shows a Mongolian Sonner toast for /login?error=auth. */
export function AuthErrorToast({ code }: { code?: string }) {
  const shown = React.useRef(false);

  React.useEffect(() => {
    if (code !== "auth" || shown.current) return;
    shown.current = true;

    toast.error(t("auth.errors.callbackFailed"));
  }, [code]);

  return null;
}
