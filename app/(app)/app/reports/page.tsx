import type { Metadata } from "next";

import { ReportsView } from "@/components/reports/reports-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.reports"),
};

export default function ReportsPage() {
  return <ReportsView />;
}
