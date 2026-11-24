import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

/** The mark plus the app name, used across the header, sidebar and auth pages. */
export function Logo({ className }: LogoProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <LogoMark size={24} className="shrink-0" />
      <span className="truncate text-sm font-semibold text-foreground tracking-tight">
        Санхүү
      </span>
    </span>
  );
}
