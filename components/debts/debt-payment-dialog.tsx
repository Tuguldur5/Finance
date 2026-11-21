"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { AmountInput } from "@/components/forms/amount-input";
import { DatePicker } from "@/components/forms/date-picker";
import { Money } from "@/components/money";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  useCreateDebtPayment,
  useDeleteDebtPayment,
} from "@/hooks/use-debts";
import { formatDateISO, formatDateMn } from "@/lib/date";
import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import {
  debtPaymentFormSchema,
  type DebtPaymentFormValues,
} from "@/lib/validation/debt";
import type {
  DebtBalanceRow,
  DebtPaymentRow,
  WalletBalanceRow,
} from "@/types/entities";

type PaymentFormProps = {
  debt: DebtBalanceRow;
  payments: DebtPaymentRow[];
  wallets: WalletBalanceRow[];
  onDone: () => void;
};

function PaymentForm({ debt, payments, wallets, onDone }: PaymentFormProps) {
  const createPayment = useCreateDebtPayment();
  const deletePayment = useDeleteDebtPayment();
  const amountId = React.useId();
  const dateId = React.useId();
  const [deleting, setDeleting] = React.useState<DebtPaymentRow | null>(null);

  const form = useForm<DebtPaymentFormValues>({
    resolver: zodResolver(debtPaymentFormSchema),
    defaultValues: {
      amount: "",
      paidAt: formatDateISO(new Date()),
      walletId: "",
      note: "",
    },
  });

  async function onSubmit(values: DebtPaymentFormValues) {
    try {
      await createPayment.mutateAsync({
        debtId: debt.id,
        amount: parseAmountInput(values.amount) ?? 0,
        paidAt: values.paidAt,
        walletId: values.walletId || null,
        note: values.note,
      });
      form.reset({
        amount: "",
        paidAt: values.paidAt,
        walletId: values.walletId,
        note: "",
      });
    } catch {
      // Toast already shown.
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
        <span className="text-muted-foreground">{t("debts.remaining")}</span>
        <Money
          amount={debt.remaining_amount}
          className="font-medium"
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor={amountId} className="text-sm font-medium">
                {t("common.amount")}
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

            <div className="grid gap-2">
              <label htmlFor={dateId} className="text-sm font-medium">
                {t("common.date")}
              </label>
              <FormField
                control={form.control}
                name="paidAt"
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
                  <FormLabel>{t("common.wallet")}</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(next) =>
                      field.onChange(next === "none" ? "" : next)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t("common.none")}</SelectItem>
                      {wallets
                        .filter((wallet) => !wallet.is_archived)
                        .map((wallet) => (
                          <SelectItem
                            key={wallet.wallet_id}
                            value={wallet.wallet_id}
                          >
                            {wallet.name} · {wallet.currency}
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
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {t("debts.addPayment")}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-5 border-t pt-4">
        <h3 className="text-sm font-medium">{t("debts.paymentHistory")}</h3>

        {payments.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("debts.noPayments")}
          </p>
        ) : (
          <ul className="mt-2 divide-y">
            {payments.slice(0, 8).map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <Money amount={payment.amount} className="text-sm font-medium" />
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateMn(payment.paid_at)}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("common.delete")}
                  onClick={() => setDeleting(payment)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onDone}>
          {t("common.close")}
        </Button>
      </div>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("debts.deletePaymentTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("debts.deletePaymentDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deletePayment.mutate(deleting.id);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type DebtPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: DebtBalanceRow | null;
  payments: DebtPaymentRow[];
  wallets: WalletBalanceRow[];
};

export function DebtPaymentDialog({
  open,
  onOpenChange,
  debt,
  payments,
  wallets,
}: DebtPaymentDialogProps) {
  const isMobile = useIsMobile();

  if (!debt) return null;

  const body = (
    <PaymentForm
      key={debt.id}
      debt={debt}
      payments={payments}
      wallets={wallets}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("debts.paymentTitle")}</DrawerTitle>
            <DrawerDescription>{debt.counterparty}</DrawerDescription>
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
          <DialogTitle>{t("debts.paymentTitle")}</DialogTitle>
          <DialogDescription>{debt.counterparty}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
