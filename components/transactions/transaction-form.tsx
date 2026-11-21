"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";

import { AmountInput } from "@/components/forms/amount-input";
import { CategorySelect } from "@/components/forms/category-select";
import { DatePicker } from "@/components/forms/date-picker";
import { TagsInput } from "@/components/forms/tags-input";
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
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { formatDateISO } from "@/lib/date";
import { parseAmountInput, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { transactionTypeLabels } from "@/lib/labels";
import {
  transactionFormSchema,
  type TransactionFormValues,
  type TransactionInput,
  type TransactionType,
} from "@/lib/validation/transaction";
import type { TransactionRow } from "@/types/entities";

type TransactionFormProps = {
  transaction?: TransactionRow | null;
  defaultType?: TransactionType;
  onDone: () => void;
};

const TYPE_OPTIONS: TransactionType[] = ["expense", "income", "transfer"];

export function TransactionForm({
  transaction,
  defaultType = "expense",
  onDone,
}: TransactionFormProps) {
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const pending = createTransaction.isPending || updateTransaction.isPending;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: transaction?.type ?? defaultType,
      amount: transaction ? String(toNumber(transaction.amount)) : "",
      walletId: transaction?.wallet_id ?? "",
      toWalletId: transaction?.to_wallet_id ?? "",
      categoryId: transaction?.category_id ?? "",
      occurredAt: transaction?.occurred_at ?? formatDateISO(new Date()),
      note: transaction?.note ?? "",
      tags: transaction?.tags ?? [],
    },
  });

  const type = form.watch("type");
  const walletId = form.watch("walletId");
  const amountId = React.useId();
  const dateId = React.useId();
  const tagsId = React.useId();
  const categoryId = React.useId();

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
    const exists = activeWallets.some(
      (item) => item.wallet_id === current,
    );

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

  async function onSubmit(values: TransactionFormValues) {
    const amount = parseAmountInput(values.amount) ?? 0;

    const input: TransactionInput = {
      type: values.type,
      amount,
      walletId: values.walletId,
      toWalletId:
        values.type === "transfer" ? values.toWalletId || null : null,
      categoryId:
        values.type === "transfer" ? null : values.categoryId || null,
      occurredAt: values.occurredAt,
      note: values.note,
      tags: values.tags,
    };

    try {
      if (transaction) {
        await updateTransaction.mutateAsync({ id: transaction.id, input });
      } else {
        await createTransaction.mutateAsync(input);
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

  if (activeWallets.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed px-4 py-6 text-center">
        <p className="text-sm font-medium">{t("wallets.emptyTitle")}</p>
        <p className="text-xs text-muted-foreground">
          {t("wallets.emptyDescription")}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/app/wallets">{t("wallets.add")}</Link>
        </Button>
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
            <Label htmlFor={dateId}>{t("transactions.occurredAt")}</Label>
            <FormField
              control={form.control}
              name="occurredAt"
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
              <Label htmlFor={categoryId}>{t("common.category")}</Label>
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <>
                    <CategorySelect
                      id={categoryId}
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

        {type === "transfer" ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("transactions.transferHint")}
          </p>
        ) : null}

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

        <div className="grid gap-2">
          <Label htmlFor={tagsId}>{t("transactions.tags")}</Label>
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <>
                <TagsInput
                  id={tagsId}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("transactions.tagsPlaceholder")}
                />
                <FormMessage />
              </>
            )}
          />
        </div>

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
            {transaction ? t("common.save") : t("common.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
