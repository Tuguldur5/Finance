"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { RecurringRulesView } from "@/components/recurring/recurring-rules-view";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { t } from "@/lib/i18n";
import type { TransactionType } from "@/lib/validation/transaction";
import type {
  TransactionFilters,
  TransactionRow,
} from "@/types/entities";

import { TransactionDialog } from "./transaction-dialog";
import {
  TransactionsFilters,
  type TransactionFilterState,
} from "./transactions-filters";
import { TransactionsTable } from "./transactions-table";

const PAGE_SIZE = 20;

const emptyFilterState: TransactionFilterState = {
  walletId: "",
  categoryId: "",
  type: "all",
  search: "",
};

export function TransactionsView() {
  const [tab, setTab] = React.useState("list");
  const [filterState, setFilterState] =
    React.useState<TransactionFilterState>(emptyFilterState);
  const [page, setPage] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TransactionRow | null>(null);
  const [deleting, setDeleting] = React.useState<TransactionRow | null>(null);

  const { data: wallets } = useWallets();
  const { data: categories } = useCategories();

  const queryFilters = React.useMemo<TransactionFilters>(
    () => ({
      from: filterState.from,
      to: filterState.to,
      walletId: filterState.walletId || undefined,
      categoryId: filterState.categoryId || undefined,
      type:
        filterState.type === "all"
          ? undefined
          : (filterState.type as TransactionType),
      search: filterState.search.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [filterState, page],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useTransactions(queryFilters);
  const deleteTransaction = useDeleteTransaction();

  const walletsById = React.useMemo(
    () => new Map((wallets ?? []).map((wallet) => [wallet.wallet_id, wallet])),
    [wallets],
  );

  const categoriesById = React.useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  const handleFilterChange = React.useCallback(
    (patch: Partial<TransactionFilterState>) => {
      setFilterState((previous) => ({ ...previous, ...patch }));
      setPage(0);
    },
    [],
  );

  const resetFilters = React.useCallback(() => {
    setFilterState(emptyFilterState);
    setPage(0);
  }, []);

  const rows = data?.rows ?? [];
  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const rangeFrom = count === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeTo = Math.min((page + 1) * PAGE_SIZE, count);

  const hasFilters = Boolean(
    filterState.from ||
      filterState.to ||
      filterState.walletId ||
      filterState.categoryId ||
      filterState.type !== "all" ||
      filterState.search.trim(),
  );

  return (
    <>
      <PageHeader
        title={t("transactions.title")}
        description={t("transactions.subtitle")}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("transactions.add")}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="list">{t("transactions.title")}</TabsTrigger>
          <TabsTrigger value="recurring">{t("recurring.title")}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-3 space-y-3">
          <TransactionsFilters
            value={filterState}
            onChange={handleFilterChange}
            onReset={resetFilters}
            wallets={wallets ?? []}
            categories={categories ?? []}
          />

          <TransactionsTable
            rows={rows}
            walletsById={walletsById}
            categoriesById={categoriesById}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            errorMessage={
              error instanceof Error ? error.message : t("errors.loadFailed")
            }
            onRetry={() => void refetch()}
            onEdit={setEditing}
            onDelete={setDeleting}
            hasFilters={hasFilters}
            emptyAction={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                {t("transactions.add")}
              </Button>
            }
          />

          {count > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {t("transactions.pageRange", {
                  from: rangeFrom,
                  to: rangeTo,
                  total: count,
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  {t("common.back")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="recurring" className="mt-3">
          <RecurringRulesView />
        </TabsContent>
      </Tabs>

      <TransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultType="expense"
      />

      <TransactionDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        transaction={editing}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("transactions.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("transactions.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                deleteTransaction.mutate(deleting.id);
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
