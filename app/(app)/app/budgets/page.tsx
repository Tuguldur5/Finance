import type { Metadata } from "next";

import { BudgetsView } from "@/components/budgets/budgets-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.budgets"),
};

export default function BudgetsPage() {
  return <BudgetsView />;
}
