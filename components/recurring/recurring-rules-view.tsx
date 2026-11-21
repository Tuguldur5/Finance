"use client";

import { MoreHorizontal, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/empty-state";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteRecurringRule,
  useRecurringRules,
  useToggleRecurringRule,
} from "@/hooks/use-recurring-rules";
import { useWallets } from "@/hooks/use-wallets";
import { formatDateShort } from "@/lib/date";
import { t } from "@/lib/i18n";
import { frequencyLabels, transactionTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { RecurringRuleRow } from "@/types/entities";

import { RecurringDialog } from "./recurring-dialog";

const typeBadgeClass: Record<string, string> = {
  income:
    "border-emerald-600/30 text-emerald-600 dark:border-emerald-400/30 dark:text-emerald-400",
  expense:
    "border-red-600/30 text-red-600 dark:border-red-400/30 dark:text-red-400",
  transfer: "border-border text-muted-foreground",
};

export function RecurringRulesView() {
  const { data, isLoading, isError, error, refetch } = useRecurringRules();
  const { data: wallets } = useWallets();
  const toggleRule = useToggleRecurringRule();
  const deleteRule = useDeleteRecurringRule();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RecurringRuleRow | null>(null);
  const [deleting, setDeleting] = React.useState<RecurringRuleRow | null>(null);

  const walletsById = React.useMemo(
    () => new Map((wallets ?? []).map((wallet) => [wallet.wallet_id, wallet])),
    [wallets],
  );

  const rules = data ?? [];

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(rule: RecurringRuleRow) {
    setEditing(rule);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-medium">{t("recurring.title")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("recurring.subtitle")}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          {t("recurring.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : t("errors.loadFailed")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void refetch()}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={t("recurring.emptyTitle")}
          description={t("recurring.emptyDescription")}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("recurring.add")}
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">{t("common.type")}</TableHead>
                <TableHead className="text-right">{t("common.amount")}</TableHead>
                <TableHead>{t("recurring.frequency")}</TableHead>
                <TableHead>{t("recurring.nextRun")}</TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t("common.wallet")}
                </TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {rules.map((rule) => {
                const wallet = walletsById.get(rule.wallet_id);

                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-md px-1.5 py-0 text-[11px] font-normal",
                          typeBadgeClass[rule.type],
                        )}
                      >
                        {transactionTypeLabels[rule.type]}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Money
                        amount={rule.amount}
                        currency={rule.currency}
                        className="text-sm font-medium"
                      />
                    </TableCell>

                    <TableCell className="text-sm">
                      {frequencyLabels[rule.frequency]}
                      {rule.interval_count > 1 ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          × {rule.interval_count}
                        </span>
                      ) : null}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {formatDateShort(rule.next_run)}
                    </TableCell>

                    <TableCell className="hidden text-sm sm:table-cell">
                      <span className="truncate">{wallet?.name ?? "—"}</span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          disabled={toggleRule.isPending}
                          onCheckedChange={(checked) =>
                            toggleRule.mutate({
                              id: rule.id,
                              isActive: checked,
                            })
                          }
                          aria-label={t("recurring.active")}
                        />
                        <span className="hidden text-xs text-muted-foreground md:inline">
                          {rule.is_active
                            ? t("recurring.active")
                            : t("recurring.inactive")}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("common.actions")}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(rule)}>
                            <Pencil className="size-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setDeleting(rule)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <RecurringDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editing}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("recurring.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("recurring.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                deleteRule.mutate(deleting.id);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
