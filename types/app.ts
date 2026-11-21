import type { ComponentType } from "react";

import type { CurrencyCode } from "@/lib/config";

export type ThemePreference = "dark" | "light" | "system";

/** Shape of a row in public.profiles. */
export type UserProfile = {
  id: string;
  display_name: string;
  currency: CurrencyCode;
  locale: string;
  theme: ThemePreference;
};

/** Minimal identity passed to shell components. */
export type ShellUser = {
  displayName: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
};

/** Nav item used by the sidebar and the mobile bar. */
export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};
