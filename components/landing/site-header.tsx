"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
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
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 24;

const NAV_ITEMS = [
  { href: "#features", labelKey: "landing.nav.features" },
  { href: "#calculators", labelKey: "landing.nav.calculators" },
  { href: "#faq", labelKey: "landing.nav.faq" },
] as const;

type SiteHeaderProps = {
  isAuthenticated: boolean;
};

export function SiteHeader({ isAuthenticated }: SiteHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [backdropSupported, setBackdropSupported] = React.useState(false);

  React.useEffect(() => {
    const supports =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      (CSS.supports("backdrop-filter", "blur(1px)") ||
        CSS.supports("-webkit-backdrop-filter", "blur(1px)"));

    setBackdropSupported(Boolean(supports));
  }, []);

  React.useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setScrolled(window.scrollY >= SCROLL_THRESHOLD);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const ctaHref = isAuthenticated ? "/app" : "/login";
  const ctaLabel = isAuthenticated
    ? t("landing.nav.dashboard")
    : t("landing.nav.login");

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto border transition-all duration-200 ease-out motion-reduce:transition-none",
          scrolled
            ? "mt-3 w-[calc(100%-1.5rem)] max-w-5xl rounded-xl px-4 sm:px-6"
            : "mt-0 w-full max-w-[100vw] border-transparent",
        )}
        style={
          scrolled
            ? {
                backgroundColor: backdropSupported
                  ? "rgba(10,10,10,0.6)"
                  : "rgba(10,10,10,0.92)",
                backdropFilter: backdropSupported
                  ? "blur(14px) saturate(140%)"
                  : undefined,
                WebkitBackdropFilter: backdropSupported
                  ? "blur(14px) saturate(140%)"
                  : undefined,
                borderColor: "rgba(255,255,255,0.08)",
                boxShadow: "0 10px 30px -14px rgba(0,0,0,0.9)",
              }
            : undefined
        }
      >
        <div
          className={cn(
            "mx-auto flex h-16 items-center justify-between gap-4",
            !scrolled && "max-w-5xl px-4 sm:px-6",
          )}
        >
          <Link
            href="/"
            aria-label={t("landing.nav.home")}
            className="shrink-0 text-neutral-50"
          >
            <Brand />
          </Link>

          <nav
            aria-label={t("landing.nav.main")}
            className="hidden items-center gap-7 md:flex"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-neutral-400 transition-colors hover:text-neutral-50"
              >
                {t(item.labelKey)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={t("landing.nav.menu")}
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="dark w-72 border-white/10 bg-[#0a0a0a] text-neutral-100"
              >
                <SheetHeader className="border-b border-white/5 pb-4">
                  <SheetTitle className="sr-only">
                    {t("landing.nav.menu")}
                  </SheetTitle>
                  <Brand />
                </SheetHeader>

                <nav className="flex flex-col gap-1 px-2">
                  {NAV_ITEMS.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <a
                        href={item.href}
                        className="rounded-md px-3 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-50"
                      >
                        {t(item.labelKey)}
                      </a>
                    </SheetClose>
                  ))}
                </nav>

                <SheetFooter className="mt-auto border-t border-white/5">
                  <SheetClose asChild>
                    <Button asChild className="w-full">
                      <Link href={ctaHref}>{ctaLabel}</Link>
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
