"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { AmountInput } from "@/components/forms/amount-input";
import { CategorySelect } from "@/components/forms/category-select";
import { DatePicker } from "@/components/forms/date-picker";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";
import {
  useCreateRecurringRule,
  useUpdateRecurringRule,
} from "@/hooks/use-recurring-rules";
import { useWallets } from "@/hooks/use-wallets";
import { formatDateISO } from "@/lib/date";
import { parseAmountInput, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import {
  frequencyLabels,
  transactionTypeLabels,
} from "@/lib/labels";
import {
  recurringFormSchema,
  type RecurringFormValues,
  type RecurringFrequency,
  type RecurringInput,
} from "@/lib/validation/recurring";
import type { TransactionType } from "@/lib/validation/transaction";
import type { RecurringRuleRow } from "@/types/entities";

type RecurringFormProps = {
  rule?: RecurringRuleRow | null;
  onDone: () => void;
};

const TYPE_OPTIONS: TransactionType[] = ["expense", "income", "transfer"];
const FREQUENCY_OPTIONS: RecurringFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

export function RecurringForm({ rule, onDone }: RecurringFormProps) {
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createRule = useCreateRecurringRule();
  const updateRule = useUpdateRecurringRule();
  const pending = createRule.isPending || updateRule.isPending;

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      type: rule?.type ?? "expense",
      amount: rule ? String(toNumber(rule.amount)) : "",
      walletId: rule?.wallet_id ?? "",
      toWalletId: rule?.to_wallet_id ?? "",
      categoryId: rule?.category_id ?? "",
      frequency: rule?.frequency ?? "monthly",
      intervalCount: String(rule?.interval_count ?? 1),
      nextRun: rule?.next_run ?? formatDateISO(new Date()),
      note: rule?.note ?? "",
    },
  });

  const type = form.watch("type");
  const walletId = form.watch("walletId");
  const amountId = React.useId();
  const dateId = React.useId();
  const categoryInputId = React.useId();

  const activeWallets = React.useMemo(
    () => (wallets ?? []).filter((wallet) => !wallet.is_archived),
    [wallets],
  );

  const activeCategories = React.useMemo(
    () =>
      (categories ?? []).filter(
        (category) => !category.is_archived && category.type === type,
      ),
    [categories, type],
  );

  const wallet = activeWallets.find((item) => item.wallet_id === walletId);
  const currency = wallet?.currency ?? "MNT";

  React.useEffect(() => {
    if (activeWallets.length === 0) return;
    const current = form.getValues("walletId");
    const exists = activeWallets.some((item) => item.wallet_id === current);

    if (!current || !exists) {
      form.setValue("walletId", activeWallets[0].wallet_id, {
        shouldValidate: false,
      });
    }
  }, [activeWallets, form]);

  function handleTypeChange(next: string) {
    const nextType = next as TransactionType;
    form.setValue("type", nextType, { shouldValidate: false });

    if (nextType === "transfer") {
      form.setValue("categoryId", "");
    } else {
      form.setValue("toWalletId", "");
    }
  }

  async function onSubmit(values: RecurringFormValues) {
    const input: RecurringInput = {
      id: rule?.id,
      type: values.type,
      amount: parseAmountInput(values.amount) ?? 0,
      walletId: values.walletId,
      toWalletId:
        values.type === "transfer" ? values.toWalletId || null : null,
      categoryId:
        values.type === "transfer" ? null : values.categoryId || null,
      frequency: values.frequency,
      intervalCount: Number(values.intervalCount),
      nextRun: values.nextRun,
      note: values.note,
      isActive: rule?.is_active ?? true,
    };

    try {
      if (rule) {
        await updateRule.mutateAsync(input);
      } else {
        await createRule.mutateAsync(input);
      }
      onDone();
    } catch {
      // Toast already shown by the mutation hook.
    }
  }

  if (walletsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("common.loading")}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Tabs value={type} onValueChange={handleTypeChange}>
          <TabsList className="grid w-full grid-cols-3">
            {TYPE_OPTIONS.map((option) => (
              <TabsTrigger key={option} value={option}>
                {transactionTypeLabels[option]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={amountId}>{t("common.amount")}</Label>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <>
                  <AmountInput
                    id={amountId}
                    value={field.value}
                    onChange={field.onChange}
                    currency={currency}
                    placeholder="0"
                  />
                  <FormMessage />
                </>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={dateId}>{t("recurring.nextRun")}</Label>
            <FormField
              control={form.control}
              name="nextRun"
              render={({ field }) => (
                <>
                  <DatePicker
                    id={dateId}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("common.date")}
                  />
                  <FormMessage />
                </>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="walletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {type === "transfer"
                    ? t("transactions.fromWallet")
                    : t("common.wallet")}
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("validation.selectWallet")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeWallets.map((item) => (
                      <SelectItem key={item.wallet_id} value={item.wallet_id}>
                        {item.name} · {item.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === "transfer" ? (
            <FormField
              control={form.control}
              name="toWalletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.toWallet")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("validation.selectWallet")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeWallets
                        .filter((item) => item.wallet_id !== walletId)
                        .map((item) => (
                          <SelectItem key={item.wallet_id} value={item.wallet_id}>
                            {item.name} · {item.currency}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="grid gap-2">
              <Label htmlFor={categoryInputId}>{t("common.category")}</Label>
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <>
                    <CategorySelect
                      id={categoryInputId}
                      categories={activeCategories}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("transactions.selectCategoryPlaceholder")}
                    />
                    <FormMessage />
                  </>
                )}
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("recurring.frequency")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {frequencyLabels[option]}
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
            name="intervalCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("recurring.interval")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    inputMode="numeric"
                    className="tabular-nums"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
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
            {rule ? t("common.save") : t("common.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
