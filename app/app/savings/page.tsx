import type { Metadata } from "next";

import { SavingsView } from "@/components/savings/savings-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.savings"),
};

export default function SavingsPage() {
  return <SavingsView />;
}
