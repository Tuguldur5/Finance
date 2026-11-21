"use client";

import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Plus, Wallet } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/empty-state";
import { EntityIcon } from "@/components/entity-icon";
import { PageHeader } from "@/components/page-header";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetWalletArchived, useWallets } from "@/hooks/use-wallets";
import { t } from "@/lib/i18n";
import { walletTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { WalletBalanceRow } from "@/types/entities";

import { WalletDialog } from "./wallet-dialog";

function WalletSkeletons() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

type WalletRowItemProps = {
  wallet: WalletBalanceRow;
  onEdit: (wallet: WalletBalanceRow) => void;
  onToggleArchive: (wallet: WalletBalanceRow) => void;
};

function WalletRowItem({ wallet, onEdit, onToggleArchive }: WalletRowItemProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        wallet.is_archived && "opacity-60",
      )}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-md border"
        style={{
          backgroundColor: `${wallet.color}1a`,
          color: wallet.color,
          borderColor: `${wallet.color}33`,
        }}
      >
        <EntityIcon name={wallet.icon} className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{wallet.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {walletTypeLabels[wallet.type]} · {wallet.currency}
        </p>
      </div>

      <Money
        amount={wallet.balance}
        currency={wallet.currency}
        tone="auto"
        className="text-sm font-medium"
      />

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
          <DropdownMenuItem onSelect={() => onEdit(wallet)}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onToggleArchive(wallet)}>
            {wallet.is_archived ? (
              <ArchiveRestore className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
            {wallet.is_archived
              ? t("wallets.unarchive")
              : t("wallets.archive")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export function WalletsView() {
  const { data, isLoading, isError, error, refetch } = useWallets();
  const setArchived = useSetWalletArchived();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WalletBalanceRow | null>(null);
  const [confirm, setConfirm] = React.useState<WalletBalanceRow | null>(null);

  const wallets = data ?? [];
  const active = wallets.filter((wallet) => !wallet.is_archived);
  const archived = wallets.filter((wallet) => wallet.is_archived);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(wallet: WalletBalanceRow) {
    setEditing(wallet);
    setDialogOpen(true);
  }

  return (
    <>
      <PageHeader
        title={t("wallets.title")}
        description={t("wallets.subtitle")}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {t("wallets.add")}
          </Button>
        }
      />

      {isLoading ? (
        <WalletSkeletons />
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
      ) : wallets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={t("wallets.emptyTitle")}
          description={t("wallets.emptyDescription")}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("wallets.add")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-xs font-medium text-muted-foreground">
              {t("wallets.activeSection")}
            </h2>
            {active.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                {t("wallets.emptyDescription")}
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {active.map((wallet) => (
                  <WalletRowItem
                    key={wallet.wallet_id}
                    wallet={wallet}
                    onEdit={openEdit}
                    onToggleArchive={setConfirm}
                  />
                ))}
              </ul>
            )}
          </section>

          {archived.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-medium text-muted-foreground">
                {t("wallets.archivedSection")}
              </h2>
              <ul className="divide-y rounded-lg border">
                {archived.map((wallet) => (
                  <WalletRowItem
                    key={wallet.wallet_id}
                    wallet={wallet}
                    onEdit={openEdit}
                    onToggleArchive={setConfirm}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <WalletDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        wallet={editing}
      />

      <AlertDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.is_archived
                ? t("wallets.unarchiveTitle")
                : t("wallets.archiveTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.is_archived
                ? t("wallets.unarchiveDescription")
                : t("wallets.archiveDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                setArchived.mutate({
                  id: confirm.wallet_id,
                  isArchived: !confirm.is_archived,
                });
              }}
            >
              {confirm?.is_archived
                ? t("wallets.unarchive")
                : t("wallets.archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
