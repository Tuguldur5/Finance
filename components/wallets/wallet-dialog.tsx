"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { t } from "@/lib/i18n";
import type { WalletBalanceRow } from "@/types/entities";

import { WalletForm } from "./wallet-form";

type WalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet?: WalletBalanceRow | null;
};

export function WalletDialog({
  open,
  onOpenChange,
  wallet,
}: WalletDialogProps) {
  const isMobile = useIsMobile();
  const title = wallet ? t("wallets.editTitle") : t("wallets.newTitle");
  const description = t("wallets.subtitle");

  const body = (
    <WalletForm
      key={wallet?.wallet_id ?? "new"}
      wallet={wallet}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
