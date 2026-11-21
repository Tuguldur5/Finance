"use client";

import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/config";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ThemeChoice = "dark" | "light";

export function ProfileSection() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { setTheme } = useTheme();

  const [displayName, setDisplayName] = React.useState("");
  const [currency, setCurrency] = React.useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [theme, setThemeChoice] = React.useState<ThemeChoice>("dark");

  const profileId = profile?.id;
  const profileName = profile?.display_name;
  const profileCurrency = profile?.currency;
  const profileTheme = profile?.theme;

  React.useEffect(() => {
    if (!profileId) return;
    setDisplayName(profileName ?? "");
    setCurrency(
      profileCurrency && isCurrencyCode(profileCurrency)
        ? profileCurrency
        : DEFAULT_CURRENCY,
    );
    setThemeChoice(profileTheme === "light" ? "light" : "dark");
  }, [profileId, profileName, profileCurrency, profileTheme]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfile.mutate(
      {
        displayName,
        currency,
        theme,
      },
      {
        onSuccess: () => setTheme(theme),
      },
    );
  }

  return (
    <Card className="gap-0 py-4">
      <CardHeader className="px-4 pb-3">
        <CardTitle className="text-sm font-medium">
          {t("settings.profileTitle")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("settings.profileDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="profile-name" className="text-xs font-medium">
                  {t("settings.displayName")}
                </Label>
                <Input
                  id="profile-name"
                  value={displayName}
                  autoComplete="name"
                  maxLength={80}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                  {t("settings.defaultCurrency")}
                </Label>
                <Select
                  value={currency}
                  onValueChange={(value) => {
                    if (isCurrencyCode(value)) setCurrency(value);
                  }}
                >
                  <SelectTrigger className="w-full" aria-label={t("settings.defaultCurrency")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs font-medium">
                {t("settings.theme")}
              </span>
              <div className="flex gap-2">
                {(
                  [
                    { value: "dark", label: t("theme.dark"), icon: Moon },
                    { value: "light", label: t("theme.light"), icon: Sun },
                  ] as const
                ).map((option) => {
                  const Icon = option.icon;
                  const active = theme === option.value;

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-pressed={active}
                      onClick={() => setThemeChoice(option.value)}
                      className={cn(active && "border-primary/60 bg-primary/10")}
                    >
                      <Icon className="size-3.5" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("settings.themeDescription")}
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {t("common.save")}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
