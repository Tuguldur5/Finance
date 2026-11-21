"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { AmountInput } from "@/components/forms/amount-input";
import { CategorySelect } from "@/components/forms/category-select";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSetBudget } from "@/hooks/use-budgets";
import { formatMonthMn } from "@/lib/date";
import { parseAmountInput, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import {
  budgetFormSchema,
  type BudgetFormValues,
} from "@/lib/validation/budget";
import type { BudgetRow, CategoryRow } from "@/types/entities";

type BudgetFormProps = {
  month: string;
  categories: CategoryRow[];
  budget?: BudgetRow | null;
  onDone: () => void;
};

function BudgetForm({ month, categories, budget, onDone }: BudgetFormProps) {
  const setBudget = useSetBudget();
  const amountId = React.useId();
  const categoryId = React.useId();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: budget?.category_id ?? "",
      amount: budget ? String(toNumber(budget.amount)) : "",
    },
  });

  const options = React.useMemo(
    () =>
      categories.filter(
        (category) =>
          !category.is_archived &&
          category.type === "expense" &&
          (budget ? category.id === budget.category_id : true),
      ),
    [categories, budget],
  );

  async function onSubmit(values: BudgetFormValues) {
    try {
      await setBudget.mutateAsync({
        categoryId: values.categoryId,
        month,
        amount: parseAmountInput(values.amount) ?? 0,
      });
      onDone();
    } catch {
      // Toast already shown.
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <p className="text-xs text-muted-foreground">
          {formatMonthMn(month)}
        </p>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.category")}</FormLabel>
              <CategorySelect
                id={categoryId}
                categories={options}
                value={field.value}
                onChange={field.onChange}
                placeholder={t("transactions.selectCategoryPlaceholder")}
                disabled={Boolean(budget)}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-2">
          <label htmlFor={amountId} className="text-sm font-medium">
            {t("budgets.limit")}
          </label>
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <>
                <AmountInput
                  id={amountId}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0"
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
            disabled={setBudget.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={setBudget.isPending}>
            {setBudget.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type BudgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  categories: CategoryRow[];
  budget?: BudgetRow | null;
};

export function BudgetDialog({
  open,
  onOpenChange,
  month,
  categories,
  budget,
}: BudgetDialogProps) {
  const isMobile = useIsMobile();
  const title = budget ? t("budgets.editTitle") : t("budgets.newTitle");
  const body = (
    <BudgetForm
      key={`${budget?.id ?? "new"}-${month}`}
      month={month}
      categories={categories}
      budget={budget}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{t("budgets.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("budgets.subtitle")}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
