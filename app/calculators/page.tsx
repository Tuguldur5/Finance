import type { Metadata } from "next";

import { CalculatorsDirectory } from "@/components/calculators/calculators-directory";
import { PageHeader } from "@/components/page-header";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("calculators.title"),
  description: t("calculators.subtitle"),
};

export default function CalculatorsPage() {
  return (
    <>
      <PageHeader
        title={t("calculators.title")}
        description={t("calculators.subtitle")}
      />
      <CalculatorsDirectory />
    </>
  );
}
