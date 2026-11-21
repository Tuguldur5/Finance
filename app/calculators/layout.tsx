import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import { t } from "@/lib/i18n";

export default function CalculatorsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
                С
              </span>
              <span className="text-sm font-semibold tracking-tight">
                {APP_NAME}
              </span>
            </Link>
            <Link
              href="/calculators"
              className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t("calculators.title")}
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t py-4 text-center text-[11px] text-muted-foreground">
        {APP_NAME} · {t("calculators.note")}
      </footer>
    </div>
  );
}
