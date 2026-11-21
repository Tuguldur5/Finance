import Link from "next/link";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickAddButton } from "@/components/transactions/quick-add-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { t } from "@/lib/i18n";
import type { ShellUser } from "@/types/app";

import { UserMenu } from "./user-menu";

export function AppHeader({ user }: { user: ShellUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 md:px-6">
      <SidebarTrigger
        className="hidden md:inline-flex"
        aria-label={t("shell.collapse")}
      />

      <Link href="/app" className="md:hidden" aria-label={t("app.name")}>
        <Brand />
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <QuickAddButton withLabel className="hidden md:inline-flex" />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
