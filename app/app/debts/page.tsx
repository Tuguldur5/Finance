import type { Metadata } from "next";

import { DebtsView } from "@/components/debts/debts-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.debts"),
};

export default function DebtsPage() {
  return <DebtsView />;
}
