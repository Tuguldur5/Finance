"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { EntityIcon, WALLET_ICON_OPTIONS } from "@/components/entity-icon";
import { AmountInput } from "@/components/forms/amount-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useCreateWallet, useUpdateWallet } from "@/hooks/use-wallets";
import {
  CURRENCY_DECIMALS,
  CURRENCY_SYMBOLS as SYMBOLS,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "@/lib/config";
import { formatNumber, parseAmountInput, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { COLOR_PRESETS, walletTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  walletFormSchema,
  type WalletFormValues,
  type WalletType,
} from "@/lib/validation/wallet";
import type { WalletBalanceRow } from "@/types/entities";

type WalletFormProps = {
  wallet?: WalletBalanceRow | null;
  onDone: () => void;
};

const walletTypes: WalletType[] = [
  "cash",
  "bank_account",
  "card",
  "e_wallet",
  "savings",
  "investment",
];

export function WalletForm({ wallet, onDone }: WalletFormProps) {
  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const pending = createWallet.isPending || updateWallet.isPending;

  const defaultCurrency: CurrencyCode = wallet?.currency ?? "MNT";
  const defaults: WalletFormValues = {
    name: wallet?.name ?? "",
    type: wallet?.type ?? "cash",
    currency: defaultCurrency,
    initialBalance: wallet
      ? formatNumber(
          toNumber(wallet.initial_balance),
          CURRENCY_DECIMALS[wallet.currency],
        )
      : "",
    color: wallet?.color ?? COLOR_PRESETS[0],
    icon: wallet?.icon ?? "wallet",
  };

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: defaults,
  });

  const currency = form.watch("currency");
  const color = form.watch("color");
  const icon = form.watch("icon");

  async function onSubmit(values: WalletFormValues) {
    const initialBalance = parseAmountInput(values.initialBalance) ?? 0;

    const input = {
      id: wallet?.wallet_id,
      name: values.name,
      type: values.type,
      currency: values.currency,
      initialBalance,
      color: values.color,
      icon: values.icon,
    };

    try {
      if (wallet) {
        await updateWallet.mutateAsync(input);
      } else {
        await createWallet.mutateAsync(input);
      }
      onDone();
    } catch {
      // Toast already shown by the mutation hook.
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.name")}</FormLabel>
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
                <FormLabel>{t("common.type")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {walletTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {walletTypeLabels[type]}
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.currency")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code} · {SYMBOLS[code]}
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
          name="initialBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("wallets.initialBalance")}</FormLabel>
              <FormControl>
                <AmountInput
                  value={field.value}
                  onChange={field.onChange}
                  currency={currency}
                  placeholder="0"
                />
              </FormControl>
              <FormDescription>{t("wallets.currencyHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("wallets.color")}</span>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={preset}
                aria-pressed={color === preset}
                onClick={() =>
                  form.setValue("color", preset, { shouldValidate: true })
                }
                className={cn(
                  "size-7 cursor-pointer rounded-md border transition-shadow duration-150",
                  color === preset
                    ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                    : "hover:ring-2 hover:ring-ring/50",
                )}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("wallets.icon")}</span>
          <div className="flex flex-wrap gap-1.5">
            {WALLET_ICON_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={option}
                aria-pressed={icon === option}
                onClick={() =>
                  form.setValue("icon", option, { shouldValidate: true })
                }
                className={cn(
                  "flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors duration-150 hover:text-foreground",
                  icon === option &&
                    "border-ring bg-accent text-foreground ring-1 ring-ring",
                )}
              >
                <EntityIcon name={option} className="size-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {wallet ? t("common.save") : t("common.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
