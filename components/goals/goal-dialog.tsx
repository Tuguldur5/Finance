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
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreateGoal, useUpdateGoal } from "@/hooks/use-goals";
import { parseAmountInput, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { COLOR_PRESETS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { goalFormSchema, type GoalFormValues } from "@/lib/validation/goal";
import type { GoalRow } from "@/types/entities";

type GoalFormProps = {
  goal?: GoalRow | null;
  onDone: () => void;
};

function GoalForm({ goal, onDone }: GoalFormProps) {
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const pending = createGoal.isPending || updateGoal.isPending;
  const amountId = React.useId();
  const dateId = React.useId();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: goal?.name ?? "",
      targetAmount: goal ? String(toNumber(goal.target_amount)) : "",
      targetDate: goal?.target_date ?? "",
      color: goal?.color ?? COLOR_PRESETS[0],
    },
  });

  const color = form.watch("color");
  const targetDate = form.watch("targetDate");

  async function onSubmit(values: GoalFormValues) {
    const input = {
      id: goal?.id,
      name: values.name,
      targetAmount: parseAmountInput(values.targetAmount) ?? 0,
      targetDate: values.targetDate || null,
      color: values.color,
    };

    try {
      if (goal) {
        await updateGoal.mutateAsync(input);
      } else {
        await createGoal.mutateAsync(input);
      }
      onDone();
    } catch {
      // Toast already shown.
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
          <div className="grid gap-2">
            <label htmlFor={amountId} className="text-sm font-medium">
              {t("goals.targetAmount")}
            </label>
            <FormField
              control={form.control}
              name="targetAmount"
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

          <div className="grid gap-2">
            <label htmlFor={dateId} className="text-sm font-medium">
              {t("goals.targetDate")}
            </label>
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <div className="flex gap-1">
                  <DatePicker
                    id={dateId}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("common.optional")}
                    className="flex-1"
                  />
                  {targetDate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => form.setValue("targetDate", "")}
                      aria-label={t("common.clear")}
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </div>
              )}
            />
          </div>
        </div>

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

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {goal ? t("common.save") : t("common.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type GoalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalRow | null;
};

export function GoalDialog({ open, onOpenChange, goal }: GoalDialogProps) {
  const isMobile = useIsMobile();
  const title = goal ? t("goals.editTitle") : t("goals.newTitle");
  const body = (
    <GoalForm
      key={goal?.id ?? "new"}
      goal={goal}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{t("goals.subtitle")}</DrawerDescription>
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
          <DialogDescription>{t("goals.subtitle")}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
