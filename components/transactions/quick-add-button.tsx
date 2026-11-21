"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { useQuickAdd } from "./quick-add-provider";

type QuickAddButtonProps = {
  className?: string;
  withLabel?: boolean;
};

export function QuickAddButton({
  className,
  withLabel = false,
}: QuickAddButtonProps) {
  const { openQuickAdd } = useQuickAdd();

  return (
    <Button
      type="button"
      size={withLabel ? "sm" : "icon"}
      variant={withLabel ? "default" : "ghost"}
      className={cn(className)}
      onClick={openQuickAdd}
      aria-label={t("shell.quickAdd")}
    >
      <Plus className="size-4" />
      {withLabel ? <span>{t("shell.quickAdd")}</span> : null}
    </Button>
  );
}
