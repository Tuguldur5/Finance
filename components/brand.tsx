import { APP_NAME } from "@/lib/config";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  showTagline?: boolean;
};

/** Text mark used in the header, sidebar and auth screens. */
export function Brand({ className, showTagline = false }: BrandProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground"
      >
        С
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-sm font-semibold tracking-tight">
          {APP_NAME}
        </span>
        {showTagline ? (
          <span className="mt-0.5 truncate text-[11px] font-normal text-muted-foreground">
            {t("shell.brandTagline")}
          </span>
        ) : null}
      </span>
    </span>
  );
}
