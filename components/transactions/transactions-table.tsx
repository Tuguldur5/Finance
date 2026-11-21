"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import * as React from "react";

import { EntityIcon } from "@/components/entity-icon";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateShort } from "@/lib/date";
import { toNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { transactionTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/validation/transaction";
import type {
  CategoryRow,
  TransactionRow,
  WalletBalanceRow,
} from "@/types/entities";

const typeBadgeClass: Record<TransactionType, string> = {
  income:
    "border-emerald-600/30 text-emerald-600 dark:border-emerald-400/30 dark:text-emerald-400",
  expense:
    "border-red-600/30 text-red-600 dark:border-red-400/30 dark:text-red-400",
  transfer: "border-border text-muted-foreground",
};

type TransactionsTableProps = {
  rows: TransactionRow[];
  walletsById: Map<string, WalletBalanceRow>;
  categoriesById: Map<string, CategoryRow>;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onEdit: (row: TransactionRow) => void;
  onDelete: (row: TransactionRow) => void;
  emptyAction?: React.ReactNode;
  hasFilters?: boolean;
};

export function TransactionsTable({
  rows,
  walletsById,
  categoriesById,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRetry,
  onEdit,
  onDelete,
  emptyAction,
  hasFilters,
}: TransactionsTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        isFetching && !isLoading && "opacity-60 transition-opacity",
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">{t("common.date")}</TableHead>
            <TableHead className="w-24">{t("common.type")}</TableHead>
            <TableHead>{t("common.category")}</TableHead>
            <TableHead>{t("common.wallet")}</TableHead>
            <TableHead className="hidden lg:table-cell">
              {t("common.note")}
            </TableHead>
            <TableHead className="text-right">{t("common.amount")}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-20" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center">
                <p className="text-sm text-destructive">
                  {errorMessage ?? t("errors.loadFailed")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={onRetry}
                >
                  {t("common.retry")}
                </Button>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  {hasFilters
                    ? t("transactions.noResults")
                    : t("transactions.emptyDescription")}
                </p>
                {!hasFilters && emptyAction ? (
                  <div className="mt-3 flex justify-center">{emptyAction}</div>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const wallet = walletsById.get(row.wallet_id);
              const toWallet = row.to_wallet_id
                ? walletsById.get(row.to_wallet_id)
                : null;
              const category = row.category_id
                ? categoriesById.get(row.category_id)
                : null;
              const amount = toNumber(row.amount);

              return (
                <TableRow key={row.id}>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {formatDateShort(row.occurred_at)}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md px-1.5 py-0 text-[11px] font-normal",
                        typeBadgeClass[row.type],
                      )}
                    >
                      {transactionTypeLabels[row.type]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {category ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="flex size-5 shrink-0 items-center justify-center rounded"
                          style={{
                            backgroundColor: `${category.color}1a`,
                            color: category.color,
                          }}
                        >
                          <EntityIcon name={category.icon} className="size-3" />
                        </span>
                        <span className="truncate text-sm">{category.name}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm">
                    {row.type === "transfer" ? (
                      <span className="flex items-center gap-1 text-xs">
                        <span className="max-w-24 truncate">
                          {wallet?.name ?? "—"}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="max-w-24 truncate">
                          {toWallet?.name ?? "—"}
                        </span>
                      </span>
                    ) : (
                      <span className="truncate">{wallet?.name ?? "—"}</span>
                    )}
                  </TableCell>

                  <TableCell className="hidden max-w-[260px] lg:table-cell">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-muted-foreground">
                        {row.note || "—"}
                      </p>
                      {row.tags && row.tags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {row.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px] font-normal"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {row.tags.length > 2 ? (
                            <span className="text-[10px] text-muted-foreground">
                              +{row.tags.length - 2}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Money
                      amount={
                        row.type === "expense"
                          ? -amount
                          : row.type === "income"
                            ? amount
                            : amount
                      }
                      currency={row.currency}
                      signed={row.type === "income"}
                      tone={
                        row.type === "income"
                          ? "positive"
                          : row.type === "expense"
                            ? "negative"
                            : "default"
                      }
                      className="text-sm font-medium"
                    />
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
                        <DropdownMenuItem onSelect={() => onEdit(row)}>
                          <Pencil className="size-4" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => onDelete(row)}
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
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
