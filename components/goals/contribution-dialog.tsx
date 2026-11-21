"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { AmountInput } from "@/components/forms/amount-input";
import { DatePicker } from "@/components/forms/date-picker";
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
  useCreateContribution,
  useDeleteContribution,
} from "@/hooks/use-goals";
import { formatDateMn, formatDateISO } from "@/lib/date";
import { parseAmountInput } from "@/lib/finance/format";
import { Money } from "@/components/money";
import { t } from "@/lib/i18n";
import {
  contributionFormSchema,
  type ContributionFormValues,
} from "@/lib/validation/goal";
import type {
  GoalContributionRow,
  GoalRow,
  WalletBalanceRow,
} from "@/types/entities";

type ContributionFormProps = {
  goal: GoalRow;
  contributions: GoalContributionRow[];
  wallets: WalletBalanceRow[];
  onDone: () => void;
};

function ContributionForm({
  goal,
  contributions,
  wallets,
  onDone,
}: ContributionFormProps) {
  const createContribution = useCreateContribution();
  const deleteContribution = useDeleteContribution();
  const amountId = React.useId();
  const dateId = React.useId();

  const [deleting, setDeleting] =
    React.useState<GoalContributionRow | null>(null);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      amount: "",
      contributedAt: formatDateISO(new Date()),
      walletId: "",
      note: "",
    },
  });

  async function onSubmit(values: ContributionFormValues) {
    try {
      await createContribution.mutateAsync({
        goalId: goal.id,
        amount: parseAmountInput(values.amount) ?? 0,
        contributedAt: values.contributedAt,
        walletId: values.walletId || null,
        note: values.note,
      });
      form.reset({
        amount: "",
        contributedAt: values.contributedAt,
        walletId: values.walletId,
        note: "",
      });
    } catch {
      // Toast already shown.
    }
  }

  return (
    <>
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
                      currency={goal.currency}
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
                name="contributedAt"
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

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={createContribution.isPending}
            >
              {createContribution.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {t("goals.contribute")}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-5 border-t pt-4">
        <h3 className="text-sm font-medium">{t("goals.historyTitle")}</h3>

        {contributions.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("goals.contributionsEmpty")}
          </p>
        ) : (
          <ul className="mt-2 divide-y">
            {contributions.slice(0, 6).map((contribution) => (
              <li
                key={contribution.id}
                className="flex items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <Money
                    amount={contribution.amount}
                    currency={goal.currency}
                    className="text-sm font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateMn(contribution.contributed_at)}
                    {contribution.note ? ` · ${contribution.note}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("common.delete")}
                  onClick={() => setDeleting(contribution)}
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
            <AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("goals.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deleteContribution.mutate(deleting.id);
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

type ContributionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: GoalRow | null;
  contributions: GoalContributionRow[];
  wallets: WalletBalanceRow[];
};

export function ContributionDialog({
  open,
  onOpenChange,
  goal,
  contributions,
  wallets,
}: ContributionDialogProps) {
  const isMobile = useIsMobile();

  if (!goal) return null;

  const body = (
    <ContributionForm
      key={goal.id}
      goal={goal}
      contributions={contributions}
      wallets={wallets}
      onDone={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("goals.contribute")}</DrawerTitle>
            <DrawerDescription>{goal.name}</DrawerDescription>
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
          <DialogTitle>{t("goals.contribute")}</DialogTitle>
          <DialogDescription>{goal.name}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
