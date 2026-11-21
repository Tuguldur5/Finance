"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { deleteAccount } from "@/app/actions/account";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t } from "@/lib/i18n";

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleDelete() {
    setPending(true);

    try {
      const result = await deleteAccount();

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Card className="gap-0 border-destructive/30 py-4">
        <CardHeader className="px-4 pb-3">
          <CardTitle className="text-sm font-medium text-destructive">
            {t("settings.dangerZone")}
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            {t("settings.dangerDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="size-4" />
            {t("settings.deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.deleteAccountTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.deleteAccountDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("settings.deleteAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
