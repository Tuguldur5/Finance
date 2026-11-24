"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { TransactionType } from "@/lib/validation/transaction";
import type { MoneyDb } from "@/types/entities";

export type ReportTransaction = {
  id: string;
  type: TransactionType;
  amount: MoneyDb;
  currency: string;
  category_id: string | null;
  wallet_id: string;
  occurred_at: string;
  note: string | null;
};

export type NetWorthSnapshot = {
  date: string;
  assets: MoneyDb;
  liabilities: MoneyDb;
};

export const reportKeys = {
  transactions: (from: string, to: string) =>
    ["report-transactions", from, to] as const,
  snapshots: ["net-worth-snapshots"] as const,
};

export function useReportTransactions(from: string, to: string) {
  return useQuery({
    queryKey: reportKeys.transactions(from, to),
    queryFn: async (): Promise<ReportTransaction[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, type, amount, currency, category_id, wallet_id, occurred_at, note",
        )
        .gte("occurred_at", from)
        .lte("occurred_at", to)
        .order("occurred_at", { ascending: false });

      if (error) throw new Error(t("errors.loadFailed"));

      return (data ?? []) as ReportTransaction[];
    },
    staleTime: 30_000,
  });
}

export function useNetWorthSnapshots() {
  return useQuery({
    queryKey: reportKeys.snapshots,
    queryFn: async (): Promise<NetWorthSnapshot[]> => {
      const supabase = createClient();

      // Cap the history at ~2 years; fetch newest first, then restore the
      // oldest-to-newest order the chart expects.
      const { data, error } = await supabase
        .from("net_worth_snapshots")
        .select("date, assets, liabilities")
        .order("date", { ascending: false })
        .limit(730);

      if (error) throw new Error(t("errors.loadFailed"));

      return ((data ?? []) as NetWorthSnapshot[]).slice().reverse();
    },
    staleTime: 60_000,
  });
}

/** Upserts today's net-worth snapshot (idempotent per day). */
export function useCaptureSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("capture_net_worth_snapshot", {
        p_date: date,
      });
      if (error) throw new Error(error.message);
      return date;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.snapshots });
    },
  });
}
