import type { Metadata } from "next";

import { CalculatorsDirectory } from "@/components/calculators/calculators-directory";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("calculators.directoryTitle"),
};

export default function AppCalculatorsPage() {
  return <CalculatorsDirectory variant="embedded" />;
}
