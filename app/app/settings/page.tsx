import type { Metadata } from "next";

import { SettingsView } from "@/components/settings/settings-view";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("nav.settings"),
};

export default function SettingsPage() {
  return <SettingsView />;
}
