"use client";

import { ArrowDown, ArrowUp, GripVertical, Wallet } from "lucide-react";
import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReorderWallets,
  useWallets,
} from "@/hooks/use-wallets";
import { t } from "@/lib/i18n";
import { walletTypeLabels } from "@/lib/labels";

export function WalletOrderSection() {
  const { data, isLoading } = useWallets();
  const reorder = useReorderWallets();

  const wallets = (data ?? []).filter((wallet) => !wallet.is_archived);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= wallets.length) return;

    const ids = wallets.map((wallet) => wallet.wallet_id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  }

  return (
    <Card className="gap-0 py-4">
      <CardHeader className="px-4 pb-3">
        <CardTitle className="text-sm font-medium">
          {t("settings.walletOrderTitle")}
        </CardTitle>
        <CardDescription className="mt-1 text-xs">
          {t("settings.walletOrderDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full rounded-md" />
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {t("settings.noWallets")}
          </p>
        ) : (
          <ul className="space-y-1">
            {wallets.map((wallet, index) => (
              <li
                key={wallet.wallet_id}
                className="flex items-center gap-2 rounded-md border px-2 py-1.5"
              >
                <GripVertical
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-md border"
                  style={{
                    backgroundColor: `${wallet.color}1a`,
                    color: wallet.color,
                    borderColor: `${wallet.color}33`,
                  }}
                >
                  <Wallet className="size-3" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{wallet.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {walletTypeLabels[wallet.type]} · {wallet.currency}
                  </p>
                </div>

                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${t("settings.moveUp")}: ${wallet.name}`}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${t("settings.moveDown")}: ${wallet.name}`}
                    disabled={index === wallets.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
