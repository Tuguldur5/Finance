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
import type { TransactionType } from "@/lib/validation/transaction";
import type { TransactionRow } from "@/types/entities";

import { TransactionForm } from "./transaction-form";

type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionRow | null;
  defaultType?: TransactionType;
};

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  defaultType = "expense",
}: TransactionDialogProps) {
  const isMobile = useIsMobile();
  // Freeze the container while the form is open. A viewport change (keyboard,
  // rotation, responsive mode) must not swap Dialog <-> Drawer and remount the
  // form, which would wipe everything the user has typed.
  const lockedMobile = React.useRef(isMobile);
  React.useEffect(() => {
    if (!open) lockedMobile.current = isMobile;
  }, [open, isMobile]);
  const renderMobile = open ? lockedMobile.current : isMobile;
  const title = transaction
    ? t("transactions.editTitle")
    : t("transactions.newTitle");

  const body = (
    <TransactionForm
      key={transaction?.id ?? `new-${defaultType}`}
      transaction={transaction}
      defaultType={defaultType}
      onDone={() => onOpenChange(false)}
    />
  );

  if (renderMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{t("transactions.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("transactions.subtitle")}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
