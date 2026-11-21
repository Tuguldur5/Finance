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
import type { RecurringRuleRow } from "@/types/entities";

import { RecurringForm } from "./recurring-form";

type RecurringDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RecurringRuleRow | null;
};

export function RecurringDialog({
  open,
  onOpenChange,
  rule,
}: RecurringDialogProps) {
  const isMobile = useIsMobile();
  const title = rule ? t("recurring.editTitle") : t("recurring.newTitle");
  const description = t("recurring.subtitle");

  const body = (
    <RecurringForm
      key={rule?.id ?? "new"}
      rule={rule}
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
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
