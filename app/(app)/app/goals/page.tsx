import type { Metadata } from "next";

import { GoalsView } from "@/components/goals/goals-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.goals"),
};

export default function GoalsPage() {
  return <GoalsView />;
}
