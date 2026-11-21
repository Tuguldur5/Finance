"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { Money } from "@/components/money";
import { FlatlineChart } from "@/components/not-found/flatline-chart";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

type Ledger404Props = {
  variant: "page" | "app";
  homeHref: string;
};

type AuthState = "loading" | "authenticated" | "anonymous";

function LedgerRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          "shrink-0",
          strong ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className="h-px min-w-4 flex-1 border-b border-dotted border-neutral-300 dark:border-neutral-700"
      />
      <span
        className={cn(
          "min-w-0 text-right tabular-nums",
          strong ? "font-semibold text-foreground" : "text-foreground/85",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Giant404() {
  return (
    <p className="flex items-start text-[clamp(88px,16vw,168px)] font-semibold leading-none tracking-[-0.04em] text-foreground/90 tabular-nums">
      <span>40</span>
      <span className="relative inline-block">
        4
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-[#3b82f6]"
        />
      </span>
    </p>
  );
}

export function Ledger404({ variant, homeHref }: Ledger404Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isApp = variant === "app";
  const [authState, setAuthState] = React.useState<AuthState>("loading");

  React.useEffect(() => {
    if (isApp) return;

    if (!hasSupabaseEnv()) {
      setAuthState("anonymous");
      return;
    }

    let active = true;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) {
          setAuthState(data.user ? "authenticated" : "anonymous");
        }
      })
      .catch(() => {
        if (active) setAuthState("anonymous");
      });

    return () => {
      active = false;
    };
  }, [isApp]);

  const primaryHref =
    isApp || authState === "authenticated" ? "/app" : homeHref;
  const primaryLabel =
    isApp || authState === "authenticated"
      ? t("notFound.dashboardCta")
      : t("notFound.homeCta");
  const primaryPending = !isApp && authState === "loading";

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-[#e5e5e5] bg-white text-foreground dark:border-[#262626] dark:bg-black",
        isApp ? "mx-auto max-w-3xl p-5 sm:p-6" : "max-w-4xl p-6 sm:p-8 md:p-10",
      )}
    >
      <div
        className={cn(
          "grid",
          isApp
            ? "gap-6 md:grid-cols-[1.15fr_0.85fr]"
            : "gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-10",
        )}
      >
        <div className="min-w-0">
          {isApp ? (
            <p className="text-5xl font-semibold leading-none tracking-[-0.04em] text-foreground/90 tabular-nums">
              404
            </p>
          ) : (
            <Giant404 />
          )}

          <div
            className={cn(
              "mt-5 rounded-md border border-[#e5e5e5] p-4 dark:border-[#262626]",
              isApp ? "mt-4 space-y-1.5 text-xs" : "space-y-2 text-sm",
            )}
          >
            <LedgerRow
              label={t("notFound.requestedPath")}
              value={
                <span
                  className="block max-w-[12rem] truncate"
                  title={pathname || "/"}
                >
                  {pathname || "/"}
                </span>
              }
            />
            <LedgerRow label={t("notFound.status")} value="404" />
            <LedgerRow label={t("notFound.pagesFound")} value="0" />
            <LedgerRow
              label={t("notFound.balance")}
              value={<Money amount={0} />}
            />

            <div className="my-3 h-px bg-[#e5e5e5] dark:bg-[#262626]" />

            <LedgerRow
              label={t("notFound.total")}
              value={t("notFound.notFoundValue")}
              strong
            />
          </div>

          <h1
            className={cn(
              "font-semibold tracking-tight",
              isApp ? "mt-5 text-lg" : "mt-6 text-xl",
            )}
          >
            {t("notFound.balanceTitle")}
          </h1>
          <p
            className={cn(
              "mt-2 text-muted-foreground",
              isApp ? "text-xs leading-relaxed" : "text-sm leading-relaxed",
            )}
          >
            {t("notFound.balanceDescription")}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {primaryPending ? (
              <span
                aria-hidden="true"
                className="inline-block h-9 w-44 shrink-0"
              />
            ) : (
              <Button asChild className="w-44">
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
            )}

            {!isApp ? (
              <Button asChild variant="outline">
                <Link href="/calculators">{t("notFound.calculatorsCta")}</Link>
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-4" />
              {t("notFound.back")}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center",
            isApp && "hidden md:flex",
          )}
        >
          <div className="w-full rounded-lg border border-[#e5e5e5] p-4 dark:border-[#262626]">
            <p className="text-xs text-muted-foreground">
              {t("notFound.chartCaption")}
            </p>
            <FlatlineChart className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {t("notFound.chartEmpty")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
