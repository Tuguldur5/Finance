import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ConfigRequired } from "@/components/shell/config-required";
import { MobileNav } from "@/components/app/mobile-nav";
import { QuickAddProvider } from "@/components/transactions/quick-add-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SIDEBAR_COOKIE } from "@/lib/config";
import { t } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/user";
import type { ShellUser, UserProfile } from "@/types/app";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseEnv()) {
    return <ConfigRequired />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, display_name, currency, locale, theme")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as UserProfile | null;
  const email = user.email ?? "";
  const metadata = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
  const displayName =
    metadata.full_name?.trim() ||
    metadata.name?.trim() ||
    profile?.display_name?.trim() ||
    email.split("@")[0] ||
    t("common.unknown");
  const avatarUrl =
    typeof metadata.avatar_url === "string" && metadata.avatar_url
      ? metadata.avatar_url
      : null;

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE)?.value !== "false";

  const shellUser: ShellUser = {
    displayName,
    email,
    initials: getInitials(displayName),
    avatarUrl,
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <QuickAddProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader user={shellUser} />
          <main className="app-shell-main flex-1 px-3 pt-4 md:px-6 md:py-6">
            {children}
          </main>
        </SidebarInset>
        <MobileNav />
      </QuickAddProvider>
    </SidebarProvider>
  );
}
