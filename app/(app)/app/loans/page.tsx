import type { Metadata } from "next";

import { LoansView } from "@/components/loans/loans-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.loans"),
};

export default function LoansPage() {
  return <LoansView />;
}
