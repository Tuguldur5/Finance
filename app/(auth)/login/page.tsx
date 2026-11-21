import type { Metadata } from "next";

import { AuthErrorToast } from "@/components/auth/auth-error-toast";
import { GoogleButton } from "@/components/auth/google-button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/config";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("auth.loginTitle"),
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <>
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {APP_NAME}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("auth.googleSubtitle")}
            </p>
          </div>

          <GoogleButton />
        </CardContent>
      </Card>

      <AuthErrorToast code={params.error} />
    </>
  );
}
