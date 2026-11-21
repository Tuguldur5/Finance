"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { AmountInput } from "@/components/forms/amount-input";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdjustSavingsBalance } from "@/hooks/use-savings";
import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import {
  savingsAdjustmentFormSchema,
  type SavingsAdjustmentFormValues,
} from "@/lib/validation/savings";
import type { SavingsAccountRow } from "@/types/entities";

type Direction = "deposit" | "withdraw";

type BalanceFormProps = {
  account: SavingsAccountRow;
  direction: Direction;
  onDone: () => void;
};

function BalanceForm({ account, direction, onDone }: BalanceFormProps) {
  const adjust = useAdjustSavingsBalance();
  const amountId = React.useId();

  const form = useForm<SavingsAdjustmentFormValues>({
    resolver: zodResolver(savingsAdjustmentFormSchema),
    defaultValues: { amount: "" },
  });

  async function onSubmit(values: SavingsAdjustmentFormValues) {
    try {
      await adjust.mutateAsync({
        id: account.id,
        amount: parseAmountInput(values.amount) ?? 0,
        direction,
      });
      onDone();
    } catch {
      // Toast already shown.
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="rounded-lg border bg-background/50 px-3 py-2 text-sm">
          <p className="text-muted-foreground">{t("savings.currentBalance")}</p>
          <Money
            amount={account.balance}
            currency={account.currency}
            className="font-semibold"
          />
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <label htmlFor={amountId} className="text-sm font-medium">
                {t("common.amount")}
              </label>
              <FormControl>
                <AmountInput
                  id={amountId}
                  value={field.value}
                  onChange={field.onChange}
                  currency={account.currency}
                  placeholder="0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={adjust.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={adjust.isPending}>
            {adjust.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {direction === "deposit"
              ? t("savings.deposit")
              : t("savings.withdraw")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type SavingsBalanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingsAccountRow | null;
  direction: Direction;
};

export function SavingsBalanceDialog({
  open,
  onOpenChange,
  account,
  direction,
}: SavingsBalanceDialogProps) {
  const isMobile = useIsMobile();

  if (!account) return null;

  const title =
    direction === "deposit" ? t("savings.depositTitle") : t("savings.withdrawTitle");
  const body = (
    <BalanceForm
      key={`${account.id}-${direction}`}
      account={account}
      direction={direction}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{account.name}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{account.name}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
