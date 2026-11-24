"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * Shown on public calculator pages only for signed-in visitors, so they can
 * return to the dashboard without signing in again.
 */
export function DashboardBackLink() {
  const [authenticated, setAuthenticated] = React.useState(false);

  React.useEffect(() => {
    if (!hasSupabaseEnv()) return;

    let active = true;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setAuthenticated(Boolean(data.user));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!authenticated) return null;

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="-ml-2 mb-3 h-7 px-2 text-xs text-muted-foreground"
    >
      <Link href="/app">
        <ArrowLeft className="size-3.5" />
        {t("calculators.backToDashboard")}
      </Link>
    </Button>
  );
}
