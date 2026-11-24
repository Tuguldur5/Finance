"use client";

import Link from "next/link";
import * as React from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-6">
          <Link
            href="/"
            aria-label={t("nav.home")}
            className="rounded-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 text-card-foreground sm:p-8">
          <p className="text-5xl font-semibold leading-none tracking-[-0.04em] text-foreground/90 tabular-nums">
            500
          </p>

          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            {t("errorPage.title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("errorPage.description")}
          </p>

          <div className="mt-5 rounded-md border border-border p-4 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 text-muted-foreground">
                {t("errorPage.status")}
              </span>
              <span
                aria-hidden="true"
                className="h-px min-w-4 flex-1 border-b border-dotted border-border"
              />
              <span className="text-right font-medium text-foreground tabular-nums">
                500
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button type="button" onClick={reset}>
              {t("errorPage.tryAgain")}
            </Button>
            <Button asChild variant="outline">
              <Link href="/">{t("errorPage.home")}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
