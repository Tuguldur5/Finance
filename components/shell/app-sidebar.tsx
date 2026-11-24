"use client";

import {
  ArrowLeftRight,
  BarChart3,
  Calculator,
  HandCoins,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  PieChart,
  Settings,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { t } from "@/lib/i18n";
import type { NavItem } from "@/types/app";

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: t("shell.groupOverview"),
    items: [
      {
        href: "/app",
        label: t("nav.dashboard"),
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/app/transactions",
        label: t("nav.transactions"),
        icon: ArrowLeftRight,
      },
      { href: "/app/wallets", label: t("nav.wallets"), icon: Wallet },
    ],
  },
  {
    label: t("shell.groupPlanning"),
    items: [
      { href: "/app/budgets", label: t("nav.budgets"), icon: PieChart },
      { href: "/app/goals", label: t("nav.goals"), icon: Target },
      { href: "/app/savings", label: t("nav.savings"), icon: PiggyBank },
    ],
  },
  {
    label: t("shell.groupDebt"),
    items: [
      { href: "/app/debts", label: t("nav.debts"), icon: HandCoins },
      { href: "/app/loans", label: t("nav.loans"), icon: Landmark },
    ],
  },
  {
    label: t("shell.groupInsights"),
    items: [
      { href: "/app/reports", label: t("nav.reports"), icon: BarChart3 },
      {
        href: "/app/calculators",
        label: t("nav.calculators"),
        icon: Calculator,
      },
    ],
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/app/settings");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-row items-center gap-2 border-b px-3">
        <Link href="/app" aria-label={t("app.name")} className="min-w-0">
          <Logo className="overflow-hidden group-data-[collapsible=icon]:w-6" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(pathname, item)}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={settingsActive}
              tooltip={t("nav.settings")}
            >
              <Link href="/app/settings">
                <Settings />
                <span>{t("nav.settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
