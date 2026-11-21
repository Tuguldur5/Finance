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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreateDebt, useUpdateDebt } from "@/hooks/use-debts";
import { formatDateISO } from "@/lib/date";
import { parseAmountInput, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import {
  debtFormSchema,
  type DebtFormValues,
  type DebtType,
} from "@/lib/validation/debt";
import type { DebtBalanceRow } from "@/types/entities";

type DebtFormProps = {
  debt?: DebtBalanceRow | null;
  defaultType?: DebtType;
  onDone: () => void;
};

function DebtForm({ debt, defaultType = "i_owe", onDone }: DebtFormProps) {
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const pending = createDebt.isPending || updateDebt.isPending;

  const principalId = React.useId();
  const startId = React.useId();
  const dueId = React.useId();

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      type: debt?.type ?? defaultType,
      counterparty: debt?.counterparty ?? "",
      principal: debt ? String(toNumber(debt.principal)) : "",
      interestRate: debt ? String(toNumber(debt.interest_rate)) : "0",
      startDate: debt?.start_date ?? formatDateISO(new Date()),
      dueDate: debt?.due_date ?? "",
      note: debt?.note ?? "",
    },
  });

  const type = form.watch("type");
  const dueDate = form.watch("dueDate");

  async function onSubmit(values: DebtFormValues) {
    const input = {
      id: debt?.id,
      type: values.type,
      counterparty: values.counterparty,
      principal: parseAmountInput(values.principal) ?? 0,
      interestRate: values.interestRate === "" ? 0 : Number(values.interestRate),
      startDate: values.startDate,
      dueDate: values.dueDate || null,
      note: values.note,
    };

    try {
      if (debt) {
        await updateDebt.mutateAsync(input);
      } else {
        await createDebt.mutateAsync(input);
      }
      onDone();
    } catch {
      // Toast already shown.
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Tabs
          value={type}
          onValueChange={(next) =>
            form.setValue("type", next as DebtType, { shouldValidate: true })
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="i_owe">{t("debts.iOwe")}</TabsTrigger>
            <TabsTrigger value="owed_to_me">{t("debts.owedToMe")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <FormField
          control={form.control}
          name="counterparty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("debts.creditor")}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor={principalId} className="text-sm font-medium">
              {t("debts.principal")}
            </label>
            <FormField
              control={form.control}
              name="principal"
              render={({ field }) => (
                <>
                  <AmountInput
                    id={principalId}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                  <FormMessage />
                </>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("debts.interestRate")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    inputMode="decimal"
                    className="tabular-nums"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor={startId} className="text-sm font-medium">
              {t("debts.startDate")}
            </label>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <>
                  <DatePicker
                    id={startId}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("common.date")}
                  />
                  <FormMessage />
                </>
              )}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor={dueId} className="text-sm font-medium">
              {t("debts.dueDate")}
            </label>
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <div className="flex gap-1">
                  <DatePicker
                    id={dueId}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("common.optional")}
                    className="flex-1"
                  />
                  {dueDate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => form.setValue("dueDate", "")}
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
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {debt ? t("common.save") : t("common.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type DebtDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: DebtBalanceRow | null;
  defaultType?: DebtType;
};

export function DebtDialog({
  open,
  onOpenChange,
  debt,
  defaultType = "i_owe",
}: DebtDialogProps) {
  const isMobile = useIsMobile();
  const title = debt ? t("debts.editTitle") : t("debts.newTitle");
  const body = (
    <DebtForm
      key={`${debt?.id ?? "new"}-${defaultType}`}
      debt={debt}
      defaultType={defaultType}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{t("debts.subtitle")}</DrawerDescription>
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
          <DialogDescription>{t("debts.subtitle")}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
