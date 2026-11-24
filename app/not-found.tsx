import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Ledger404 } from "@/components/not-found/ledger-404";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: t("notFound.metaTitle") },
  robots: { index: false },
};

export default function NotFound() {
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
        <Ledger404 variant="page" homeHref="/" />
      </main>
    </div>
  );
}
