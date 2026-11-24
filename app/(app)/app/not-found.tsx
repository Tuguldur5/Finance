import type { Metadata } from "next";

import { Ledger404 } from "@/components/not-found/ledger-404";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { absolute: t("notFound.metaTitle") },
  robots: { index: false },
};

/** Unknown /app/* URLs stay inside the dashboard shell and only link to /app. */
export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-6">
      <Ledger404 variant="app" homeHref="/app" />
    </div>
  );
}
