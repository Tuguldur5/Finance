"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 24;

const NAV_ITEMS = [
  { href: "/#features", labelKey: "nav.features" },
  { href: "/calculators", labelKey: "nav.calculatorsPlural" },
  { href: "/#faq", labelKey: "nav.faq" },
] as const;

type AuthState = "loading" | "authenticated" | "anonymous";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = React.useState(false);
  const [authState, setAuthState] = React.useState<AuthState>("loading");

  useIsomorphicLayoutEffect(() => {
    let frame = 0;
    let last = window.scrollY >= SCROLL_THRESHOLD;

    setScrolled(last);

    const onScroll = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const next = window.scrollY >= SCROLL_THRESHOLD;

        if (next !== last) {
          last = next;
          setScrolled(next);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  React.useEffect(() => {
    if (!hasSupabaseEnv()) {
      setAuthState("anonymous");
      return;
    }

    let active = true;
    const supabase = createClient();

    const resolve = (signedIn: boolean) => {
      if (active) setAuthState(signedIn ? "authenticated" : "anonymous");
    };

    supabase.auth
      .getUser()
      .then(({ data }) => resolve(Boolean(data.user)))
      .catch(() => resolve(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(Boolean(session?.user));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const transparentHome = isHome && !scrolled;
  const glass = !isHome || scrolled;
  const ctaHref = authState === "authenticated" ? "/app" : "/login";
  const ctaLabel =
    authState === "authenticated"
      ? t("nav.dashboard")
      : t("nav.login");

  const cta =
    authState === "loading" ? (
      <span
        aria-hidden="true"
        className="inline-block h-8 w-36 shrink-0"
      />
    ) : (
      <Button asChild size="sm" className="min-w-36">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    );

  return (
    <header role="banner" className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto border transition-all duration-200 ease-out motion-reduce:transition-none",
          glass
            ? "mt-3 w-[calc(100%-1.5rem)] max-w-5xl rounded-xl bg-[var(--site-header-glass)] shadow-[0_10px_30px_-14px_rgba(0,0,0,0.35)] backdrop-blur-[14px] backdrop-saturate-[140%] [-webkit-backdrop-filter:blur(14px)_saturate(140%)] dark:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.9)]"
            : "mt-0 w-full max-w-[100vw] border-transparent bg-transparent",
          glass && "border-[var(--site-header-border)]",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6",
            !glass && "max-w-5xl",
          )}
        >
          <Link
            href="/"
            aria-label={t("nav.home")}
            className={cn(
              "shrink-0 rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              transparentHome ? "text-white" : "text-foreground",
            )}
          >
            <Brand />
          </Link>

          <nav
            aria-label={t("nav.main")}
            className="hidden items-center gap-7 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = item.href.startsWith("/calculators")
                ? pathname.startsWith("/calculators")
                : false;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative rounded-sm text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    transparentHome
                      ? "text-neutral-300 hover:text-white"
                      : isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(item.labelKey)}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1.5 left-0 h-px w-full bg-primary"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <div className={cn(transparentHome && "text-white")}>
              <ThemeToggle />
            </div>

            <div className="hidden sm:block">{cta}</div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("nav.menu")}
                  className={cn(
                    "md:hidden",
                    transparentHome &&
                      "text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
                  <Brand />
                </SheetHeader>

                <nav
                  aria-label={t("nav.main")}
                  className="flex flex-col gap-1 px-2"
                >
                  {NAV_ITEMS.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        {t(item.labelKey)}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <SheetFooter className="mt-auto border-t">
                  <div className="flex w-full items-center justify-between gap-2">
                    <ThemeToggle />
                    {cta}
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
