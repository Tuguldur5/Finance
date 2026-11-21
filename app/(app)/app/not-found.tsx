import type { Metadata } from "next";

import { Ledger404 } from "@/components/not-found/ledger-404";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: t("notFound.metaTitle") },
  robots: { index: false },
};

export default function AppNotFound() {
  return <Ledger404 variant="app" homeHref="/app" />;
}
