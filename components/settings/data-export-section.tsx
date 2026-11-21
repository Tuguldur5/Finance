"use client";

import { Download, FileJson, Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { exportAccountData } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { downloadCsvText, downloadTextFile } from "@/lib/csv";
import { todayISO } from "@/lib/date";
import { t } from "@/lib/i18n";

type Busy = "json" | "csv" | null;

export function DataExportSection() {
  const [busy, setBusy] = React.useState<Busy>(null);

  async function handleExport(kind: Exclude<Busy, null>) {
    setBusy(kind);

    try {
      const result = await exportAccountData();

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const stamp = todayISO();

      if (kind === "json") {
        downloadTextFile(
          `sankhuu-export-${stamp}.json`,
          result.data.json,
          "application/json",
        );
      } else {
        downloadCsvText(
          `sankhuu-transactions-${stamp}.csv`,
          result.data.csv,
        );
      }

      toast.success(t("toasts.exported"));
    } catch {
      toast.error(t("errors.network"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="gap-0 py-4">
      <CardHeader className="px-4 pb-3">
        <CardTitle className="text-sm font-medium">
          {t("settings.dataTitle")}
        </CardTitle>
        <CardDescription className="mt-1 text-xs">
          {t("settings.exportDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleExport("json")}
          disabled={busy !== null}
        >
          {busy === "json" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileJson className="size-4" />
          )}
          {t("settings.exportJson")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleExport("csv")}
          disabled={busy !== null}
        >
          {busy === "csv" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {t("settings.exportCsv")}
        </Button>
      </CardContent>
    </Card>
  );
}
