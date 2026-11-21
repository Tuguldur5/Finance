import { TriangleAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";

/** Rendered instead of the app when Supabase env vars are missing. */
export function ConfigRequired() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TriangleAlert className="size-4 text-destructive" />
            {t("errors.misconfigured")}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("errors.misconfiguredHint")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
