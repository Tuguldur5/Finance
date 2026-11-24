"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col justify-center rounded-lg border bg-card p-6 text-card-foreground sm:p-8">
      <p className="text-5xl font-semibold leading-none tracking-[-0.04em] text-foreground/90 tabular-nums">
        500
      </p>

      <h1 className="mt-5 text-xl font-semibold tracking-tight">
        {t("errorPage.title")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("errorPage.description")}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={reset}>
          {t("errorPage.tryAgain")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/app">{t("notFound.dashboardCta")}</Link>
        </Button>
      </div>
    </div>
  );
}
