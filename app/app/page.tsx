import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.dashboard"),
};

export default function DashboardPage() {
  return <DashboardView />;
}
