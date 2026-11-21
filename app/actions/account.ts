"use server";

import { toCsv } from "@/lib/csv";
import { t } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/actions";

const EXPORT_TABLES = [
  "profiles",
  "wallets",
  "categories",
  "transactions",
  "recurring_rules",
  "budgets",
  "savings_goals",
  "goal_contributions",
  "debts",
  "debt_payments",
  "loans",
  "net_worth_snapshots",
] as const;

export type AccountExport = {
  json: string;
  csv: string;
};

function rowValue(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export async function exportAccountData(): Promise<ActionResult<AccountExport>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  const payload: Record<string, Record<string, unknown>[]> = {};

  for (const table of EXPORT_TABLES) {
    const { data, error } = await supabase.from(table).select("*");

    if (error) {
      return { ok: false, error: t("errors.loadFailed") };
    }

    payload[table] = (data ?? []) as Record<string, unknown>[];
  }

  const json = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      email: user.email ?? null,
      ...payload,
    },
    null,
    2,
  );

  const categories = new Map(
    (payload.categories ?? []).map((row) => [
      rowValue(row, "id"),
      rowValue(row, "name"),
    ]),
  );
  const wallets = new Map(
    (payload.wallets ?? []).map((row) => [
      rowValue(row, "id"),
      rowValue(row, "name"),
    ]),
  );

  const rows: (string | number | null)[][] = [
    ["date", "type", "category", "wallet", "amount", "currency", "note", "tags"],
  ];

  for (const transaction of payload.transactions ?? []) {
    rows.push([
      rowValue(transaction, "occurred_at"),
      rowValue(transaction, "type"),
      categories.get(rowValue(transaction, "category_id")) ?? "",
      wallets.get(rowValue(transaction, "wallet_id")) ?? "",
      rowValue(transaction, "amount"),
      rowValue(transaction, "currency"),
      rowValue(transaction, "note"),
      rowValue(transaction, "tags"),
    ]);
  }

  return { ok: true, data: { json, csv: toCsv(rows) } };
}

/**
 * Deletes the signed-in auth user. All rows cascade from auth.users.
 * Requires the server-only service role key.
 */
export async function deleteAccount(): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: t("errors.unauthorized") };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: t("errors.misconfigured") };
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { ok: false, error: t("errors.deleteFailed") };
  }

  await supabase.auth.signOut();

  return { ok: true, data: null };
}
