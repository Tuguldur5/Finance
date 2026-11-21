"use client";

import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  PiggyBank,
  PieChart,
  Plus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useQuickAdd } from "@/components/transactions/quick-add-provider";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/app";

const items: NavItem[] = [
  {
    href: "/app",
    label: t("nav.dashboardShort"),
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/app/transactions",
    label: t("nav.transactionsShort"),
    icon: ArrowLeftRight,
  },
  { href: "/app/wallets", label: t("nav.walletsShort"), icon: Wallet },
  { href: "/app/budgets", label: t("nav.budgetsShort"), icon: PieChart },
  { href: "/app/savings", label: t("nav.savingsShort"), icon: PiggyBank },
  { href: "/app/reports", label: t("nav.reportsShort"), icon: BarChart3 },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const { openQuickAdd } = useQuickAdd();

  return (
    <>
      <nav
        aria-label={t("shell.mobileNav")}
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-6">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 transition-colors duration-150",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  <span
                    className={cn(
                      "text-[11px] leading-none",
                      active && "font-medium",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Button
        type="button"
        size="icon"
        className="fixed right-4 bottom-[4.5rem] z-40 size-12 rounded-full shadow-lg md:hidden"
        onClick={openQuickAdd}
        aria-label={t("shell.quickAdd")}
      >
        <Plus className="size-5" />
      </Button>
    </>
  );
}
