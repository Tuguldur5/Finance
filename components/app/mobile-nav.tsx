"use client";

import {
  ArrowLeftRight,
  BarChart3,
  Calculator,
  Grid2X2,
  HandCoins,
  Landmark,
  LayoutDashboard,
  PieChart,
  PiggyBank,
  Plus,
  Settings,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { useQuickAdd } from "@/components/transactions/quick-add-provider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const PRIMARY_TABS: Tab[] = [
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
];

const MORE_ITEMS: Tab[] = [
  { href: "/app/wallets", label: t("nav.wallets"), icon: Wallet },
  {
    href: "/app/savings",
    label: t("shell.savingsGoals"),
    icon: PiggyBank,
  },
  { href: "/app/debts", label: t("nav.debts"), icon: HandCoins },
  { href: "/app/loans", label: t("nav.loans"), icon: Landmark },
  { href: "/app/reports", label: t("nav.reports"), icon: BarChart3 },
  { href: "/app/calculators", label: t("nav.calculators"), icon: Calculator },
  { href: "/app/settings", label: t("nav.settings"), icon: Settings },
];

function isActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Slot({
  active,
  label,
  children,
}: {
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-14 min-w-14 flex-col items-center justify-center gap-0.5 px-1",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </span>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { openQuickAdd, isOpen: quickAddOpen } = useQuickAdd();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const moreActive =
    isActive(pathname, "/app/goals") ||
    MORE_ITEMS.some((item) => isActive(pathname, item.href));
  const hidden = quickAddOpen || sheetOpen;

  return (
    <>
      {hidden ? null : (
        <nav
          aria-label={t("shell.mobileNav")}
          className="app-mobile-nav md:hidden"
        >
          <div className="grid h-full grid-cols-5 items-center">
            {PRIMARY_TABS.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href, item.exact);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex h-full items-center justify-center rounded-[18px] outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  style={{ transition: "transform 100ms" }}
                >
                  <Slot active={active} label={item.label}>
                    <span className="relative flex size-9 items-center justify-center">
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute h-7 w-9 rounded-[14px] bg-primary/[0.14]"
                        />
                      ) : null}
                      <Icon
                        aria-hidden="true"
                        className="relative size-[22px]"
                        strokeWidth={1.75}
                      />
                    </span>
                  </Slot>
                </Link>
              );
            })}

            <div className="flex h-full items-center justify-center">
              <button
                type="button"
                onClick={openQuickAdd}
                aria-label={t("shell.quickAdd")}
                className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{ transition: "transform 100ms" }}
              >
                <Plus className="size-[22px]" strokeWidth={1.75} />
              </button>
            </div>

            <Link
              href="/app/budgets"
              aria-current={
                isActive(pathname, "/app/budgets") ? "page" : undefined
              }
              className="flex h-full items-center justify-center rounded-[18px] outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              style={{ transition: "transform 100ms" }}
            >
              <Slot
                active={isActive(pathname, "/app/budgets")}
                label={t("nav.budgetsShort")}
              >
                <span className="relative flex size-9 items-center justify-center">
                  {isActive(pathname, "/app/budgets") ? (
                    <span
                      aria-hidden="true"
                      className="absolute h-7 w-9 rounded-[14px] bg-primary/[0.14]"
                    />
                  ) : null}
                  <PieChart
                    aria-hidden="true"
                    className="relative size-[22px]"
                    strokeWidth={1.75}
                  />
                </span>
              </Slot>
            </Link>

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label={t("nav.more")}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className="flex h-full items-center justify-center rounded-[18px] outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              style={{ transition: "transform 100ms" }}
            >
              <Slot active={moreActive} label={t("nav.more")}>
                <span className="relative flex size-9 items-center justify-center">
                  {moreActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute h-7 w-9 rounded-[14px] bg-primary/[0.14]"
                    />
                  ) : null}
                  <Grid2X2
                    aria-hidden="true"
                    className="relative size-[22px]"
                    strokeWidth={1.75}
                  />
                </span>
              </Slot>
            </button>
          </div>
        </nav>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] overflow-y-auto pb-[calc(16px+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="border-b pb-3">
            <SheetTitle>{t("nav.more")}</SheetTitle>
          </SheetHeader>

          <nav aria-label={t("nav.more")} className="px-2 pb-2">
            <ul className="grid gap-0.5">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-md px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className="size-5"
                          strokeWidth={1.75}
                        />
                        {item.label}
                      </Link>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
