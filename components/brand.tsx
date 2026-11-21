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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.svg"
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
        className="size-6 shrink-0 rounded-md"
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-sm font-semibold tracking-tight">
          {t("app.name")}
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
