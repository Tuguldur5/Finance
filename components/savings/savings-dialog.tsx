"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { AmountInput } from "@/components/forms/amount-input";
import { DatePicker } from "@/components/forms/date-picker";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useCreateSavingsAccount,
  useUpdateSavingsAccount,
} from "@/hooks/use-savings";
import { parseAmountInput, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import {
  savingsAccountFormSchema,
  type SavingsAccountFormValues,
} from "@/lib/validation/savings";
import type {
  SavingsAccountRow,
  SavingsAccountType,
  SavingsLiquidity,
} from "@/types/entities";

const TYPES: SavingsAccountType[] = [
  "savings",
  "investment",
  "bond",
  "stock",
  "other",
];

const LIQUIDITIES: SavingsLiquidity[] = ["instant", "term", "long_term"];

type SavingsFormProps = {
  account?: SavingsAccountRow | null;
  onDone: () => void;
};

function SavingsForm({ account, onDone }: SavingsFormProps) {
  const createAccount = useCreateSavingsAccount();
  const updateAccount = useUpdateSavingsAccount();
  const pending = createAccount.isPending || updateAccount.isPending;

  const balanceId = React.useId();
  const rateId = React.useId();
  const maturityId = React.useId();

  const form = useForm<SavingsAccountFormValues>({
    resolver: zodResolver(savingsAccountFormSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "savings",
      institution: account?.institution ?? "",
      balance: account ? String(toNumber(account.balance)) : "",
      expectedRate: account ? String(toNumber(account.expected_rate)) : "0",
      liquidity: account?.liquidity ?? "instant",
      maturityDate: account?.maturity_date ?? "",
      note: account?.note ?? "",
    },
  });

  const maturityDate = form.watch("maturityDate");

  async function onSubmit(values: SavingsAccountFormValues) {
    const input = {
      id: account?.id,
      name: values.name,
      type: values.type,
      institution: values.institution,
      balance: parseAmountInput(values.balance) ?? 0,
      expectedRate:
        values.expectedRate === "" ? 0 : Number(values.expectedRate),
      liquidity: values.liquidity,
      maturityDate: values.maturityDate || null,
      note: values.note,
    };

    try {
      if (account) {
        await updateAccount.mutateAsync(input);
      } else {
        await createAccount.mutateAsync(input);
      }
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("savings.name")}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("savings.typeLabel")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`savings.types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="liquidity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("savings.liquidity")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LIQUIDITIES.map((liquidity) => (
                      <SelectItem key={liquidity} value={liquidity}>
                        {t(`savings.liquidityOptions.${liquidity}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("savings.institution")}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor={balanceId} className="text-sm font-medium">
              {t("savings.balance")}
            </label>
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <>
                  <AmountInput
                    id={balanceId}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                  <FormMessage />
                </>
              )}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor={rateId} className="text-sm font-medium">
              {t("savings.expectedRate")}
            </label>
            <FormField
              control={form.control}
              name="expectedRate"
              render={({ field }) => (
                <>
                  <Input
                    id={rateId}
                    type="number"
                    min={0}
                    max={1000}
                    step="0.1"
                    inputMode="decimal"
                    className="tabular-nums"
                    {...field}
                  />
                  <FormMessage />
                </>
              )}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor={maturityId} className="text-sm font-medium">
            {t("savings.maturityDate")}
          </label>
          <FormField
            control={form.control}
            name="maturityDate"
            render={({ field }) => (
              <div className="flex gap-1">
                <DatePicker
                  id={maturityId}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("common.optional")}
                  className="flex-1"
                />
                {maturityDate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => form.setValue("maturityDate", "")}
                    aria-label={t("common.clear")}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.note")}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
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
            disabled={pending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {account ? t("common.save") : t("common.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type SavingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: SavingsAccountRow | null;
};

export function SavingsDialog({
  open,
  onOpenChange,
  account,
}: SavingsDialogProps) {
  const isMobile = useIsMobile();
  const title = account ? t("savings.editTitle") : t("savings.newTitle");
  const body = (
    <SavingsForm
      key={account?.id ?? "new"}
      account={account}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{t("savings.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[75vh] overflow-y-auto px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("savings.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
