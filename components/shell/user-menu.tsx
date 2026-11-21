"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { ShellUser } from "@/types/app";

export function UserMenu({ user }: { user: ShellUser }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(t("errors.generic"));
        setPending(false);
        return;
      }

      toast.success(t("toasts.signedOut"));
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-1.5">
          <Avatar className="size-7">
            {user.avatarUrl ? (
              <AvatarImage
                src={user.avatarUrl}
                alt={user.displayName}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm sm:inline">
            {user.displayName}
          </span>
          <span className="sr-only">{t("shell.account")}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="size-8">
            {user.avatarUrl ? (
              <AvatarImage
                src={user.avatarUrl}
                alt={user.displayName}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">
              {user.displayName}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <Settings className="size-4" />
            {t("nav.settings")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={pending}
          onSelect={() => {
            void handleSignOut();
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
