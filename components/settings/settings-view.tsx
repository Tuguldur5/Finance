"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";

import { CategoryManager } from "./category-manager";
import { DangerZone } from "./danger-zone";
import { DataExportSection } from "./data-export-section";
import { ProfileSection } from "./profile-section";
import { WalletOrderSection } from "./wallet-order-section";

export function SettingsView() {
  return (
    <>
      <PageHeader
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <div className="space-y-4">
        <ProfileSection />

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <CategoryManager />
          <div className="space-y-4">
            <WalletOrderSection />
            <DataExportSection />
          </div>
        </div>

        <DangerZone />
      </div>

      <Card className="mt-4 border-dashed">
        <CardContent className="pt-4 text-[11px] leading-relaxed text-muted-foreground">
          <p>{t("settings.language")}: Монгол</p>
          <p className="mt-1">{t("landing.privacyNote")}</p>
        </CardContent>
      </Card>
    </>
  );
}
