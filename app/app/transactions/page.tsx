import type { Metadata } from "next";

import { TransactionsView } from "@/components/transactions/transactions-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.transactions"),
};

export default function TransactionsPage() {
  return <TransactionsView />;
}
