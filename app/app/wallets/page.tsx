import type { Metadata } from "next";

import { WalletsView } from "@/components/wallets/wallets-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.wallets"),
};

export default function WalletsPage() {
  return <WalletsView />;
}
