"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreateLoan, useUpdateLoan } from "@/hooks/use-loans";
import { formatDateISO } from "@/lib/date";
import { parseAmountInput, toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import {
  loanFormSchema,
  type LoanFormValues,
  type LoanPaymentTypeValue,
} from "@/lib/validation/loan";
import type { LoanRow } from "@/types/entities";

type LoanFormProps = {
  loan?: LoanRow | null;
  onDone: () => void;
};

function LoanForm({ loan, onDone }: LoanFormProps) {
  const createLoan = useCreateLoan();
  const updateLoan = useUpdateLoan();
  const pending = createLoan.isPending || updateLoan.isPending;

  const principalId = React.useId();
  const termId = React.useId();
  const dateId = React.useId();

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      lender: loan?.lender ?? "",
      principal: loan ? String(toNumber(loan.principal)) : "",
      annualRate: loan ? String(toNumber(loan.annual_rate)) : "0",
      termMonths: loan ? String(loan.term_months) : "12",
      startDate: loan?.start_date ?? formatDateISO(new Date()),
      paymentType: loan?.payment_type ?? "annuity",
      note: loan?.note ?? "",
    },
  });

  const paymentType = form.watch("paymentType");

  async function onSubmit(values: LoanFormValues) {
    const input = {
      id: loan?.id,
      lender: values.lender,
      principal: parseAmountInput(values.principal) ?? 0,
      annualRate: values.annualRate === "" ? 0 : Number(values.annualRate),
      termMonths: Number(values.termMonths),
      startDate: values.startDate,
      paymentType: values.paymentType,
      note: values.note,
    };

    try {
      if (loan) {
        await updateLoan.mutateAsync(input);
      } else {
        await createLoan.mutateAsync(input);
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
          name="lender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("loans.lender")}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-2">
          <Label>{t("loans.paymentType")}</Label>
          <Tabs
            value={paymentType}
            onValueChange={(next) =>
              form.setValue("paymentType", next as LoanPaymentTypeValue, {
                shouldValidate: true,
              })
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="annuity">{t("loans.annuity")}</TabsTrigger>
              <TabsTrigger value="equal_principal">
                {t("loans.equalPrincipal")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor={principalId} className="text-sm font-medium">
              {t("loans.principal")}
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
            name="annualRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("loans.annualRate")}</FormLabel>
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
          <FormField
            control={form.control}
            name="termMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("loans.termMonths")}</FormLabel>
                <FormControl>
                  <Input
                    id={termId}
                    type="number"
                    min={1}
                    max={600}
                    inputMode="numeric"
                    className="tabular-nums"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-2">
            <label htmlFor={dateId} className="text-sm font-medium">
              {t("loans.startDate")}
            </label>
            <FormField
              control={form.control}
              name="startDate"
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
            {loan ? t("common.save") : t("common.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type LoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: LoanRow | null;
};

export function LoanDialog({ open, onOpenChange, loan }: LoanDialogProps) {
  const isMobile = useIsMobile();
  const title = loan ? t("loans.editTitle") : t("loans.newTitle");
  const body = (
    <LoanForm
      key={loan?.id ?? "new"}
      loan={loan}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{t("loans.subtitle")}</DrawerDescription>
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
          <DialogDescription>{t("loans.subtitle")}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
